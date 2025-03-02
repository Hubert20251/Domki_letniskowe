// Import wymaganych modułów
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const session = require('express-session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');




// Tworzymy aplikację Express
const app = express();
app.use(cors()); // Zezwala na żądania z innych domen (np. frontend)
app.use(bodyParser.json()); // Obsługa JSON w żądaniach
app.use(express.static('public'));
app.use(express.json()); // Kluczowe do odbierania JSON-a!
app.use('/uploads', express.static('public/uploads'));
const multer = require('multer');
const path = require('path');

// Konfiguracja przechowywania zdjęć
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unikalna nazwa pliku
    }
});

const upload = multer({ storage: storage });


// Konfiguracja połączenia z bazą danych MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,  
    user: process.env.DB_USER,        
    password: process.env.DB_PASSWORD,        
    database: process.env.DB_NAME 
});

// Sprawdzenie połączenia z bazą
db.connect(err => {
    if (err) {
        console.error('❌ Błąd połączenia z MySQL:', err);
        return;
    }
    console.log('✅ Połączono z bazą danych MySQL');
});

// Obsługa sesji
app.use(session({
    secret: 'mojSekretnyKlucz',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 } 
}));

// 📌 Rejestracja użytkownika
app.post('/api/register', async (req, res) => {
    console.log("📥 Otrzymane dane w backendzie:", req.body); // Sprawdzenie w konsoli backendu

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        console.log("⚠ Brak wymaganych pól:", { name, email, password });
        return res.status(400).json({ message: "Wszystkie pola są wymagane!" });
    }

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error("❌ Błąd przy sprawdzaniu użytkownika:", err);
            return res.status(500).json({ message: "Błąd serwera" });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: "Użytkownik już istnieje" });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            db.query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "user")',
                [name, email, hashedPassword],
                (err) => {
                    if (err) {
                        console.error("❌ Błąd zapisu użytkownika:", err);
                        return res.status(500).json({ message: "Błąd serwera" });
                    }
                    res.json({ success: true, message: "✅ Rejestracja udana!" });
                }
            );
        } catch (error) {
            console.error("❌ Błąd szyfrowania hasła:", error);
            res.status(500).json({ message: "Błąd serwera przy szyfrowaniu hasła" });
        }
    });
});




// 📌 Logowanie użytkownika
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ message: "Błąd serwera" });

        if (results.length === 0) return res.status(401).json({ message: "Nieprawidłowy email lub hasło" });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Nieprawidłowy email lub hasło" });

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email }, 
            'sekretnyklucz', 
            { expiresIn: '1h' }
        );
        

        req.session.token = token;
        req.session.role = user.role;

        res.json({
            success: true,
            message: "Zalogowano!",
            role: user.role,
            redirect: user.role === "admin" ? "admin.html" : "index.html"
        });
    });
});



// 📌 Sprawdzanie sesji
app.get('/api/session', (req, res) => {
    console.log("🔍 Sprawdzam sesję:", req.session);

    if (!req.session.token) {
        return res.json({ loggedIn: false });
    }

    jwt.verify(req.session.token, 'sekretnyklucz', (err, decoded) => {
        if (err) {
            req.session.destroy();
            return res.json({ loggedIn: false });
        }

        db.query('SELECT name, email, role FROM users WHERE id = ?', [decoded.id], (err, results) => {
            if (err || results.length === 0) {
                req.session.destroy();
                return res.json({ loggedIn: false });
            }

            console.log("✅ Sesja aktywna:", results[0].email, "Rola:", results[0].role);
            res.json({ 
                loggedIn: true, 
                role: results[0].role,  // WAŻNE! Sprawdź, czy tu na pewno zwraca "admin"
                name: results[0].name, 
                email: results[0].email 
            });
        });
    });
});





// 📌 Wylogowanie
app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true, message: "Wylogowano!" });
    });
});




app.post('/api/book', (req, res) => {
    console.log("📥 Otrzymane dane z frontend:", req.body); // DEBUG

    const { house_id, user_name, user_email, phone, amount, date_from, date_to } = req.body;

    if (!house_id || !user_name || !user_email || !phone || !amount || !date_from || !date_to) {
        console.log("⚠ Brakuje danych w formularzu!", { house_id, user_name, user_email, phone, amount, date_from, date_to });
        return res.status(400).json({ message: "Wszystkie pola są wymagane!" });
    }

    // Sprawdzenie, czy domek jest już zarezerwowany w danym przedziale czasowym
db.query(
    `SELECT * FROM bookings WHERE house_id = ? AND 
    ((date_from <= ? AND date_to >= ?) OR (date_from <= ? AND date_to >= ?) OR 
    (date_from >= ? AND date_to <= ?))`,
    [house_id, date_from, date_from, date_to, date_to, date_from, date_to],
    (err, results) => {
        if (err) {
            console.error("❌ Błąd sprawdzania dostępności rezerwacji:", err);
            return res.status(500).json({ message: "Błąd serwera" });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: "❌ Domek jest już zarezerwowany w tym okresie!" });
        }

        // Jeśli domek nie jest zarezerwowany, dodaj nową rezerwację
        db.query(
            'INSERT INTO bookings (house_id, user_name, user_email, phone, amount, date_from, date_to) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [house_id, user_name, user_email, phone, amount, date_from, date_to],
            (err) => {
                if (err) {
                    console.error("❌ Błąd zapisu rezerwacji:", err);
                    return res.status(500).json({ message: "Błąd serwera" });
                }
                res.json({ success: true, message: "✅ Rezerwacja dodana!" });
            }
        );
    }
);

});


// 📌 Pobieranie listy domków
app.get('/api/houses', (req, res) => {
    const query = `
        SELECT h.*, 
               CASE 
                   WHEN b.house_id IS NOT NULL THEN 1 
                   ELSE 0 
               END AS is_reserved
        FROM houses h
        LEFT JOIN bookings b 
        ON h.id = b.house_id 
        AND (b.date_from <= CURDATE() AND b.date_to >= CURDATE());
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Błąd pobierania domków:", err);
            return res.status(500).send("Błąd serwera");
        }
        res.json(results);
    });
});

app.get('/api/bookings', (req, res) => {
    const user_email = req.query.user_email;
    
    let query = 'SELECT id, house_id, user_name, phone, amount, date_from, date_to FROM bookings';
    let params = [];

    if (user_email) {
        query += ' WHERE user_email = ?';
        params.push(user_email);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error("❌ Błąd pobierania rezerwacji:", err);
            return res.status(500).send("Błąd serwera");
        }

        console.log("📄 Pobranie rezerwacji:", results);
        res.json(results);
    });
});














  app.get('/api/session', (req, res) => {
    console.log("🔍 Sprawdzam sesję:", req.session);

    if (req.session.token) {
        jwt.verify(req.session.token, 'sekretnyklucz', (err, decoded) => {
            if (err) {
                return res.json({ loggedIn: false });
            }

            db.query('SELECT name, email, role FROM users WHERE id = ?', [decoded.id], (err, results) => {
                if (err || results.length === 0) {
                    return res.json({ loggedIn: false });
                }

                console.log("✅ Sesja aktywna dla:", results[0].email, "Rola:", results[0].role);
                res.json({ 
                    loggedIn: true, 
                    role: results[0].role, 
                    name: results[0].name, 
                    email: results[0].email 
                });
            });
        });
    } else {
        res.json({ loggedIn: false });
    }
});





  
// pobieranie wszystkich rezerwacji

  app.get('/api/admin/bookings', (req, res) => {
    if (!req.session.token) {
        return res.status(403).json({ message: "Brak autoryzacji" });
    }

    jwt.verify(req.session.token, 'sekretnyklucz', (err, decoded) => {
        if (err || decoded.role !== "admin") {
            return res.status(403).json({ message: "Brak uprawnień" });
        }

        db.query('SELECT * FROM bookings', (err, results) => {
            if (err) {
                console.error("❌ Błąd pobierania rezerwacji:", err);
                return res.status(500).send("Błąd serwera");
            }
            res.json(results);
        });
    });
});


//edycja rezerwacji
app.put('/api/admin/bookings/:id', (req, res) => {
    if (!req.session.token) {
        return res.status(403).json({ message: "Brak autoryzacji" });
    }

    jwt.verify(req.session.token, 'sekretnyklucz', (err, decoded) => {
        if (err || decoded.role !== "admin") {
            return res.status(403).json({ message: "Brak uprawnień" });
        }

        const { user_name, date_from, date_to } = req.body;
        const bookingId = req.params.id;

        db.query(
            'UPDATE bookings SET user_name = ?, date_from = ?, date_to = ? WHERE id = ?',
            [user_name, date_from, date_to, bookingId],
            (err) => {
                if (err) {
                    console.error("❌ Błąd edycji rezerwacji:", err);
                    return res.status(500).json({ message: "Błąd serwera" });
                }
                res.json({ success: true, message: "✅ Rezerwacja zaktualizowana!" });
            }
        );
    });
});




//usuwanie rezerwacji
app.delete('/api/admin/bookings/:id', (req, res) => {
    if (!req.session.token) {
        return res.status(403).json({ message: "Brak autoryzacji" });
    }

    jwt.verify(req.session.token, 'sekretnyklucz', (err, decoded) => {
        if (err || decoded.role !== "admin") {
            return res.status(403).json({ message: "Brak uprawnień" });
        }

        const bookingId = req.params.id;

        db.query('DELETE FROM bookings WHERE id = ?', [bookingId], (err) => {
            if (err) {
                console.error("❌ Błąd usuwania rezerwacji:", err);
                return res.status(500).json({ message: "Błąd serwera" });
            }
            res.json({ success: true, message: "🗑️ Rezerwacja usunięta!" });
        });
    });
});


// formularz wiadomości

app.post('/submit', (req, res) => {
    const { name, email, message } = req.body;
  
    // Logowanie odebranych danych
    console.log('Odebrane dane:', { name, email, message });
  
    // Walidacja danych
    if (!name || !email || !message) {
      return res.status(400).send('Wszystkie pola są wymagane');
    }
  
    // Zapytanie SQL do zapisania danych w tabeli
    const query = 'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)';
    db.query(query, [name, email, message], (err, result) => {
      if (err) {
        console.error('Błąd przy dodawaniu do bazy danych:', err);
        return res.status(500).send('Błąd serwera');
      }
      res.send('Wiadomość została wysłana!');
    });
  });
  


  

// Pobieranie wszystkich wiadomości
app.get("/api/admin/messages", (req, res) => {
    if (!req.session.token) {
        return res.status(403).json({ message: "Brak autoryzacji" });
    }

    jwt.verify(req.session.token, 'sekretnyklucz', (err, decoded) => {
        if (err || decoded.role !== "admin") {
            return res.status(403).json({ message: "Brak uprawnień" });
        }

        db.query("SELECT * FROM messages ORDER BY created_at DESC", (err, results) => {
            if (err) {
                console.error("❌ Błąd pobierania wiadomości:", err);
                return res.status(500).json({ error: "Błąd serwera" });
            }
            res.json(results);
        });
    });
});

// Usuwanie wiadomości
app.delete("/api/admin/messages/:id", (req, res) => {
    if (!req.session.token) {
        return res.status(403).json({ message: "Brak autoryzacji" });
    }

    jwt.verify(req.session.token, 'sekretnyklucz', (err, decoded) => {
        if (err || decoded.role !== "admin") {
            return res.status(403).json({ message: "Brak uprawnień" });
        }

        const messageId = req.params.id;

        db.query("DELETE FROM messages WHERE id = ?", [messageId], (err) => {
            if (err) {
                console.error("❌ Błąd usuwania wiadomości:", err);
                return res.status(500).json({ error: "Błąd serwera" });
            }
            res.json({ success: true, message: "🗑️ Wiadomość usunięta!" });
        });
    });
});










// Pobieranie wszystkich domków (tylko dla administratora)
app.get("/api/admin/houses", (req, res) => {
    if (!req.session.token) {
        return res.status(403).json({ message: "Brak autoryzacji" });
    }

    jwt.verify(req.session.token, 'sekretnyklucz', (err, decoded) => {
        if (err || decoded.role !== "admin") {
            return res.status(403).json({ message: "Brak uprawnień" });
        }

        db.query("SELECT * FROM houses ORDER BY id DESC", (err, results) => {
            if (err) {
                console.error("❌ Błąd pobierania domków:", err);
                return res.status(500).json({ error: "Błąd serwera" });
            }
            res.json(results);
        });
    });
});


// 📌 Dodawanie nowej oferty
app.post('/api/admin/houses', upload.single('image'), (req, res) => {
    if (!req.session.token) {
        return res.status(403).json({ message: "Brak autoryzacji" });
    }

    jwt.verify(req.session.token, 'sekretnyklucz', (err, decoded) => {
        if (err || decoded.role !== "admin") {
            return res.status(403).json({ message: "Brak uprawnień" });
        }

        const { name, description, price } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; // Ścieżka do zdjęcia

        if (!name || !description || !price || !imageUrl) {
            return res.status(400).json({ message: "Wszystkie pola są wymagane!" });
        }

        db.query(
            "INSERT INTO houses (name, description, price, image_url) VALUES (?, ?, ?, ?)",
            [name, description, price, imageUrl],
            (err, result) => {
                if (err) {
                    console.error("❌ Błąd dodawania oferty:", err);
                    return res.status(500).json({ message: "Błąd serwera" });
                }
                res.json({ success: true, message: "✅ Oferta dodana!" });
            }
        );
    });
});




// Edycja oferty
app.put('/api/admin/houses/:id', upload.single('image'), (req, res) => {
    if (!req.session.token) {
        return res.status(403).json({ message: "Brak autoryzacji" });
    }

    jwt.verify(req.session.token, 'sekretnyklucz', (err, decoded) => {
        if (err || decoded.role !== "admin") {
            return res.status(403).json({ message: "Brak uprawnień" });
        }

        const houseId = req.params.id;
        const { name, description, price } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; // Sprawdzamy, czy przesłano nowe zdjęcie

        const query = imageUrl 
            ? "UPDATE houses SET name = ?, description = ?, price = ?, image_url = ? WHERE id = ?"
            : "UPDATE houses SET name = ?, description = ?, price = ? WHERE id = ?";

        const params = imageUrl 
            ? [name, description, price, imageUrl, houseId] 
            : [name, description, price, houseId];

        db.query(query, params, (err) => {
            if (err) {
                console.error("❌ Błąd edycji oferty:", err);
                return res.status(500).json({ message: "Błąd serwera" });
            }
            res.json({ success: true, message: "✅ Oferta zaktualizowana!" });
        });
    });
});







// 📌 Usuwanie oferty
app.delete('/api/admin/houses/:id', (req, res) => {
    if (!req.session.token) {
        return res.status(403).json({ message: "Brak autoryzacji" });
    }

    jwt.verify(req.session.token, 'sekretnyklucz', (err, decoded) => {
        if (err || decoded.role !== "admin") {
            return res.status(403).json({ message: "Brak uprawnień" });
        }

        const houseId = req.params.id;

        const query = `DELETE FROM houses WHERE id = ?`;
        db.query(query, [houseId], (err) => {
            if (err) {
                console.error("❌ Błąd usuwania oferty:", err);
                return res.status(500).json({ message: "Błąd serwera" });
            }
            res.json({ success: true, message: "🗑️ Oferta usunięta!" });
        });
    });
});


// Obsługa użytkowników

// Pobieranie wszystkich użytkowników
app.get("/api/admin/users", (req, res) => {
    if (!req.session.token) {
        return res.status(403).json({ message: "Brak autoryzacji" });
    }

    jwt.verify(req.session.token, 'sekretnyklucz', (err, decoded) => {
        if (err || decoded.role !== "admin") {
            return res.status(403).json({ message: "Brak uprawnień" });
        }

        db.query("SELECT id, name, email, role FROM users ORDER BY id ASC", (err, results) => {
            if (err) {
                console.error("❌ Błąd pobierania użytkowników:", err);
                return res.status(500).json({ error: "Błąd serwera" });
            }
            res.json(results);
        });
    });
});








// Dodawanie użytkownika
app.post("/api/admin/users", async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "Wszystkie pola są wymagane" });
    }

    try {
        // Sprawdzenie czy użytkownik już istnieje
        const [existingUser] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Użytkownik z tym adresem e-mail już istnieje!" });
        }

        // Hashowanie hasła
        const hashedPassword = await bcrypt.hash(password, 10);

        // Zapis do bazy danych z zahashowanym hasłem
        const query = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
        await db.promise().query(query, [name, email, hashedPassword, role]);

        res.json({ success: true, message: "✅ Użytkownik dodany!" });
    } catch (err) {
        console.error("❌ Błąd dodawania użytkownika:", err);
        res.status(500).json({ error: "Błąd serwera" });
    }
});



// Edytowanie użytkownika
app.put("/api/admin/users/:id", (req, res) => {
    const { name, role } = req.body;
    const userId = req.params.id;

    if (!name || !role) {
        return res.status(400).json({ message: "Wszystkie pola są wymagane" });
    }

    db.query("UPDATE users SET name = ?, role = ? WHERE id = ?", [name, role, userId], (err) => {
        if (err) {
            console.error("❌ Błąd edycji użytkownika:", err);
            return res.status(500).json({ error: "Błąd serwera" });
        }
        res.json({ success: true, message: "✏️ Użytkownik zaktualizowany!" });
    });
});

// Usuwanie użytkownika
app.delete("/api/admin/users/:id", (req, res) => {
    if (!req.session.token) {
        return res.status(403).json({ message: "Brak autoryzacji" });
    }

    jwt.verify(req.session.token, 'sekretnyklucz', (err, decoded) => {
        if (err || decoded.role !== "admin") {
            return res.status(403).json({ message: "Brak uprawnień" });
        }

        const userId = req.params.id;

        db.query("DELETE FROM users WHERE id = ?", [userId], (err) => {
            if (err) {
                console.error("❌ Błąd usuwania użytkownika:", err);
                return res.status(500).json({ error: "Błąd serwera" });
            }
            res.json({ success: true, message: "🗑️ Użytkownik usunięty!" });
        });
    });
});


const storageOpinions = multer.diskStorage({
    destination: 'public/uploads/opinions/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const uploadOpinions = multer({ storage: storageOpinions });


app.get("/api/opinie", (req, res) => {
    db.query("SELECT user_name, content, rating, image_url, created_at FROM opinions ORDER BY created_at DESC", (err, results) => {
        if (err) {
            console.error("❌ Błąd pobierania opinii:", err);
            return res.status(500).json({ message: "Błąd serwera" });
        }
        res.json(results);
    });
});


app.get("/api/opinie/srednia", (req, res) => {
    db.query("SELECT COALESCE(AVG(rating), 0) AS srednia FROM opinions", (err, results) => {
        if (err) {
            console.error("❌ Błąd obliczania średniej oceny:", err);
            return res.status(500).json({ message: "Błąd serwera" });
        }
        res.json({ srednia: parseFloat(results[0].srednia) });
    });
});


app.post("/api/opinie", uploadOpinions.array("images", 5), (req, res) => {
    const { content, rating, user_name } = req.body;
    if (!content || !rating || !user_name) {
        return res.status(400).json({ message: "Brak danych opinii!" });
    }

    // Pobieranie linków do obrazów
    const image_urls = req.files ? req.files.map(file => `/uploads/opinions/${file.filename}`) : [];

    db.query("INSERT INTO opinions (user_name, content, rating, image_url) VALUES (?, ?, ?, ?)", 
        [user_name, content, rating, JSON.stringify(image_urls)], // Zapisujemy jako JSON
        (err) => {
            if (err) {
                console.error("❌ Błąd zapisu opinii:", err);
                return res.status(500).json({ message: "Błąd serwera" });
            }
            res.json({ success: true, message: "✅ Opinia dodana!" });
        }
    );
});




app.get("/api/admin/opinie", (req, res) => {
    if (!req.session.token) {
        return res.status(403).json({ message: "Brak autoryzacji" });
    }

    jwt.verify(req.session.token, 'sekretnyklucz', (err, decoded) => {
        if (err || decoded.role !== "admin") {
            return res.status(403).json({ message: "Brak uprawnień" });
        }

        db.query("SELECT * FROM opinions", (err, results) => {
            if (err) {
                console.error("❌ Błąd pobierania opinii:", err);
                return res.status(500).json({ error: "Błąd serwera", details: err });
            }
            res.json(results);
        });
    });
});

// Edytowanie opinii
app.put("/api/admin/opinie/:id", uploadOpinions.array("images", 5), (req, res) => {
    if (!req.session.token) {
        return res.status(403).json({ message: "Brak autoryzacji" });
    }

    jwt.verify(req.session.token, 'sekretnyklucz', (err, decoded) => {
        if (err || decoded.role !== "admin") {
            return res.status(403).json({ message: "Brak uprawnień" });
        }

        const opiniaId = req.params.id;
        const { content, rating } = req.body;

        if (!content || !rating) {
            return res.status(400).json({ message: "Treść opinii i ocena są wymagane" });
        }

        // Pobranie nowych zdjęć, jeśli zostały dodane
        const image_urls = req.files ? req.files.map(file => `/uploads/opinions/${file.filename}`) : [];

        // Aktualizacja opinii, jeśli są nowe zdjęcia
        const query = image_urls.length > 0
            ? "UPDATE opinions SET content = ?, rating = ?, image_url = ? WHERE id = ?"
            : "UPDATE opinions SET content = ?, rating = ? WHERE id = ?";

        const params = image_urls.length > 0
            ? [content, rating, JSON.stringify(image_urls), opiniaId]
            : [content, rating, opiniaId];

        db.query(query, params, (err) => {
            if (err) {
                console.error("❌ Błąd edytowania opinii:", err);
                return res.status(500).json({ error: "Błąd serwera" });
            }
            res.json({ success: true, message: "✏️ Opinia zaktualizowana!" });
        });
    });
});




// Usuwanie opinii
app.delete("/api/admin/opinie/:id", (req, res) => {
    if (!req.session.token) {
        return res.status(403).json({ message: "Brak autoryzacji" });
    }

    jwt.verify(req.session.token, 'sekretnyklucz', (err, decoded) => {
        if (err || decoded.role !== "admin") {
            return res.status(403).json({ message: "Brak uprawnień" });
        }

        const opiniaId = req.params.id;

        db.query("DELETE FROM opinions WHERE id = ?", [opiniaId], (err) => {
            if (err) {
                console.error("❌ Błąd usuwania opinii:", err);
                return res.status(500).json({ error: "Błąd serwera" });
            }
            res.json({ success: true, message: "🗑️ Opinia usunięta!" });
        });
    });
});


// 📌 Usuwanie rezerwacji przez użytkownika
app.delete('/api/bookings/:id', (req, res) => {
    if (!req.session.token) {
        console.log("❌ Brak tokena w sesji!");
        return res.status(403).json({ message: "Brak autoryzacji" });
    }

    jwt.verify(req.session.token, 'sekretnyklucz', (err, decoded) => {
        if (err) {
            console.log("❌ Błąd dekodowania tokena JWT:", err);
            return res.status(403).json({ message: "Brak dostępu" });
        }

        console.log("🔍 Odczytany token JWT:", decoded);

        const bookingId = req.params.id;
        if (!bookingId) {
            return res.status(400).json({ message: "Brak ID rezerwacji" });
        }

        const userEmail = decoded.email;
        console.log(`🔍 Sprawdzam rezerwację ID: ${bookingId} dla użytkownika: ${userEmail}`);

        db.query('SELECT * FROM bookings WHERE id = ?', [bookingId], (err, results) => {
            if (err) {
                console.error("❌ Błąd pobierania rezerwacji:", err);
                return res.status(500).json({ message: "Błąd serwera" });
            }

            console.log("📄 Wynik zapytania:", results);

            if (results.length === 0) {
                return res.status(404).json({ message: "Rezerwacja nie istnieje" });
            }

            if (results[0].user_email !== userEmail) {
                console.log(`⛔ Użytkownik ${userEmail} nie ma uprawnień do usunięcia tej rezerwacji.`);
                return res.status(403).json({ message: "Nie możesz usunąć tej rezerwacji" });
            }

            db.query('DELETE FROM bookings WHERE id = ?', [bookingId], (err) => {
                if (err) {
                    console.error("❌ Błąd usuwania rezerwacji:", err);
                    return res.status(500).json({ message: "Błąd serwera" });
                }
                res.json({ success: true, message: "🗑️ Rezerwacja usunięta!" });
            });
        });
    });
});














// 📌 Uruchomienie serwera
app.listen(3000, () => {
    console.log('🚀 Serwer działa na https://domki-letniskowe.onrender-1.com');
});




