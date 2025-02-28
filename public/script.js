document.addEventListener("DOMContentLoaded", async () => {
    await fetchHouses();
    await checkSession();
});

fetch("https://domki-letniskowe.onrender.com/api/session")
    .then(res => res.json())
    .then(data => console.log("🛠 Odpowiedź serwera:", data));



    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("showLogin").addEventListener("click", showLoginForm);
        document.getElementById("showRegister").addEventListener("click", showRegisterForm);
    });
    


function toggleVisibility(elementId) {
    const element = document.getElementById(elementId);
    element.style.display = element.style.display === "none" ? "block" : "none";
}



async function checkSession() {
    try {
        const response = await fetch("https://domki-letniskowe.onrender.com/api/session");
        const data = await response.json();
        console.log("👤 Zalogowany użytkownik:", data);

        return data;
    } catch (error) {
        console.error("❌ Błąd sprawdzania sesji:", error);
        return { loggedIn: false };
    }
}







document.addEventListener("DOMContentLoaded", async () => {
    console.log("📂 `script.js` ZAŁADOWANY! Sprawdzam sesję...");
    
    const data = await checkSession();
    
    if (data.loggedIn && data.role === "admin") {
        console.log("🔒 Użytkownik jest administratorem! Ukrywam inne linki.");
        document.getElementById("admin-link").style.display = "block";

        // Czekamy, aż DOM się w pełni załaduje
        setTimeout(() => {
            const allLinks = document.querySelectorAll("nav ul li"); // Pobieramy wszystkie elementy <li>
            console.log("🔍 Znalezione linki:", allLinks.length);

            allLinks.forEach(link => {
                const anchor = link.querySelector("a");
                if (anchor) {
                    const href = anchor.getAttribute("href");
                    if (href && href !== "index.html" && href !== "admin.html") {
                        link.style.display = "none"; // Ukrycie linku
                        console.log(`❌ Ukrywam: ${href}`);
                    }
                }
            });
        }, 100); // Opóźnienie 100ms dla pewności, że DOM jest gotowy
    }
});





// Uruchomienie funkcji po załadowaniu strony
document.addEventListener("DOMContentLoaded", async () => {
    await checkSession();
});


// Uruchomienie sprawdzenia sesji po załadowaniu strony
document.addEventListener("DOMContentLoaded", async () => {
    await checkSession();
});










// Obsługa rejestracji
function showRegisterForm() {
    checkSession().then(user => {
        if (user.loggedIn) {
            alert("Jesteś już zalogowany!");
            return;
        }

        // Tworzymy overlay (zaciemnione tło)
        const overlay = document.createElement("div");
        overlay.classList.add("modal-overlay");
        document.body.appendChild(overlay);

        // Tworzymy formularz rejestracji
        const registerForm = document.createElement("div");
        registerForm.classList.add("modal");
        registerForm.innerHTML = `
            <h2>Rejestracja</h2>
            <label for="regName">Imię:</label>
            <input type="text" id="regName" required>
            <label for="regEmail">E-mail:</label>
            <input type="email" id="regEmail" required>
            <label for="regPassword">Hasło:</label>
            <input type="password" id="regPassword" required>
            <button id="confirmRegister">Zarejestruj</button>
            <button id="closeRegisterModal">Anuluj</button>
        `;

        document.body.appendChild(registerForm);

        // Potwierdzenie rejestracji
        document.getElementById("confirmRegister").addEventListener("click", () => {
            const name = document.getElementById("regName").value;
            const email = document.getElementById("regEmail").value;
            const password = document.getElementById("regPassword").value;
            registerUser(name, email, password);
            closeForm(registerForm, overlay); // Zamknięcie formularza po rejestracji
        });

        // Zamknięcie formularza
        document.getElementById("closeRegisterModal").addEventListener("click", () => {
            closeForm(registerForm, overlay); // Zamknięcie formularza bez rejestracji
        });

        // Zamknięcie formularza klikając w overlay (tło)
        overlay.addEventListener("click", () => {
            closeForm(registerForm, overlay); // Zamknięcie formularza po kliknięciu w overlay
        });
    });
}

function registerUser() {
    const nameField = document.getElementById("regName");
    const emailField = document.getElementById("regEmail");
    const passwordField = document.getElementById("regPassword");

    if (!nameField || !emailField || !passwordField) {
        console.error("❌ Błąd: Nie znaleziono pól formularza!");
        return;
    }

    const name = nameField.value.trim();
    const email = emailField.value.trim();
    const password = passwordField.value.trim();

    console.log("🟢 Wartości pól formularza:", { name, email, password });

    if (!name || !email || !password) {
        alert("⚠ Proszę wypełnić wszystkie pola!");
        return;
    }

    // 📌 Walidacja e-maila za pomocą wyrażenia regularnego
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
        alert("⚠ Wprowadź poprawny adres e-mail!");
        return;
    }

    const userData = { name, email, password };
    console.log("📤 Wysyłane dane do API:", userData);

    fetch("https://domki-letniskowe.onrender.com/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
    })
    .then(response => response.json())
    .then(data => {
        console.log("📥 Odpowiedź serwera:", data);
        if (data.success) {
            alert("✅ Rejestracja udana! Możesz się teraz zalogować.");
            nameField.value = "";
            emailField.value = "";
            passwordField.value = "";
        } else {
            alert("⚠ Błąd rejestracji: " + data.message);
        }
    })
    .catch(error => {
        console.error("❌ Błąd połączenia z serwerem:", error);
        alert("Błąd serwera. Spróbuj ponownie później.");
    });
}



// Logowanie użytkownika
function showLoginForm() {
    checkSession().then(user => {
        if (user.loggedIn) {
            alert("Jesteś już zalogowany!");
            return;
        }

        // Tworzymy overlay (zaciemnione tło)
        const overlay = document.createElement("div");
        overlay.classList.add("modal-overlay");
        document.body.appendChild(overlay);

        // Tworzymy formularz logowania
        const loginForm = document.createElement("div");
        loginForm.classList.add("modal");
        loginForm.innerHTML = `
            <h2>Logowanie</h2>
            <label for="loginEmail">E-mail:</label>
            <input type="email" id="loginEmail" required>
            <label for="loginPassword">Hasło:</label>
            <input type="password" id="loginPassword" required>
            <button id="confirmLogin">Zaloguj</button>
            <button id="closeLoginModal">Anuluj</button>
        `;

        document.body.appendChild(loginForm);

        // Potwierdzenie logowania
        document.getElementById("confirmLogin").addEventListener("click", () => {
            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;
            loginUser(email, password);
            closeForm(loginForm, overlay); // Zamknięcie formularza po zalogowaniu
        });

        // Zamknięcie formularza
        document.getElementById("closeLoginModal").addEventListener("click", () => {
            closeForm(loginForm, overlay); // Zamknięcie formularza bez logowania
        });

        // Zamknięcie formularza klikając w overlay (tło)
        overlay.addEventListener("click", () => {
            closeForm(loginForm, overlay); // Zamknięcie formularza po kliknięciu w overlay
        });
    });
}

async function loginUser(email, password) {
    const response = await fetch('https://domki-letniskowe.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
        alert("Zalogowano!");
        
        // Aktualizacja sesji
        const sessionData = await checkSession();

        // Natychmiastowa aktualizacja UI
        updateUI(sessionData);

        await fetchHouses(); // Ponowne załadowanie domków, by odblokować przyciski
    } else {
        alert("Błąd logowania: " + data.message);
    }
}


function updateUI(data) {
    if (data.loggedIn) {
        document.getElementById('status').innerText = `Zalogowano jako: ${data.name}`;
        document.getElementById('status').style.color = 'white';  // Ustawienie białej czcionki
        document.getElementById('logoutButton').style.display = "block";
        document.getElementById("showLogin").style.display = "none";
        document.getElementById("showRegister").style.display = "none";
        document.getElementById("reservations-link").style.display = "block";

        if (data.role === "admin") {
            document.getElementById("admin-link").style.display = "block";

            // Ukryj inne linki dla admina
            document.querySelectorAll("nav ul li").forEach(link => {
                const anchor = link.querySelector("a");
                if (anchor) {
                    const href = anchor.getAttribute("href");
                    if (href && href !== "index.html" && href !== "admin.html") {
                        link.style.display = "none"; // Ukrycie niepotrzebnych linków
                    }
                }
            });
        }
    } else {
        document.getElementById('status').innerText = "";
        document.getElementById('logoutButton').style.display = "none";
        document.getElementById("showLogin").style.display = "block";
        document.getElementById("showRegister").style.display = "block";
        document.getElementById("reservations-link").style.display = "none";
        document.getElementById("admin-link").style.display = "none";
    }
}



// Wylogowanie użytkownika
document.getElementById('logoutButton').addEventListener('click', async () => {
    await fetch('https://domki-letniskowe.onrender.com/api/logout', { method: 'POST' });
    alert("Wylogowano!");
    await checkSession();
    await fetchHouses(); // Odświeżenie przycisków po wylogowaniu
});





function toggleMenu() {
    const menu = document.querySelector(".navbar ul");
    const toggle = document.querySelector(".menu-toggle");
    menu.classList.toggle("active");
    toggle.classList.toggle("open");
}


async function checkSession() {
    const response = await fetch('https://domki-letniskowe.onrender.com/api/session');
    const data = await response.json();

    if (data.loggedIn) {
        document.getElementById('status').innerText = `Zalogowano jako: ${data.name}`;
        document.getElementById('logoutButton').style.display = "block";
        document.getElementById('loginForm').style.display = "none";
        document.getElementById('registerForm').style.display = "none";
        document.getElementById("showLogin").style.display = "none";
        document.getElementById("showRegister").style.display = "none";

        // Pokazanie linku do rezerwacji
        document.getElementById("reservations-link").style.display = "block";
    } else {
        document.getElementById('status').innerText = "";
        document.getElementById('logoutButton').style.display = "none";
        document.getElementById("showLogin").style.display = "block";
        document.getElementById("showRegister").style.display = "block";

        // Ukrycie linku do rezerwacji
        document.getElementById("reservations-link").style.display = "none";
    }

    return data;
}


let selectedRating = 0;

document.addEventListener("DOMContentLoaded", async () => {
    const sessionData = await checkSession();
    if (sessionData.loggedIn) {
        document.getElementById("dodaj-opinie").style.display = "block";
    }
    pobierzOpinie();
    pobierzSredniaOcene();

    document.querySelectorAll(".star").forEach(star => {
        star.addEventListener("mouseover", highlightStars);
        star.addEventListener("mouseout", resetStars);
        star.addEventListener("click", selectStar);
    });

    // Obsługa zamykania modala po kliknięciu w tło
    document.getElementById("image-modal").addEventListener("click", closeModal);
});

function highlightStars(event) {
    const value = event.target.getAttribute("data-value");
    document.querySelectorAll(".star").forEach(star => {
        star.style.color = star.getAttribute("data-value") <= value ? "gold" : "gray";
    });
}

function resetStars() {
    document.querySelectorAll(".star").forEach(star => {
        star.style.color = star.getAttribute("data-value") <= selectedRating ? "gold" : "gray";
    });
}

function selectStar(event) {
    selectedRating = event.target.getAttribute("data-value");
    resetStars();
}

async function pobierzOpinie() {
    const response = await fetch("http://localhost:3000/api/opinie");
    const opinie = await response.json();
    const opinieLista = document.getElementById("opinie-lista");
    opinieLista.innerHTML = "";

    opinie.forEach(opinia => {
        const opiniaDiv = document.createElement("div");
        opiniaDiv.classList.add("opinia");

        const dataDodania = new Date(opinia.created_at);
        const sformatowanaData = dataDodania.toLocaleDateString("pl-PL", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });

        // Poprawiona obsługa obrazów
        let imagesHTML = "";
        if (opinia.image_url) {
            let images;
            try {
                images = JSON.parse(opinia.image_url); // Próbujemy sparsować JSON
                if (!Array.isArray(images)) {
                    images = [images]; // Jeśli to nie tablica, robimy z tego tablicę
                }
            } catch (error) {
                images = [opinia.image_url]; // Jeśli parsowanie się nie powiedzie, traktujemy jako pojedynczy URL
            }

            imagesHTML = images.map(img => `<img src="${img}" class="opinia-img" onclick="openModal('${img}')">`).join("");
        }

        opiniaDiv.innerHTML = `
            <p><strong>${opinia.user_name}</strong>: ${opinia.content} (${opinia.rating} ★)</p>
            <p class="opinia-data">📅 Dodano: ${sformatowanaData}</p>
            ${imagesHTML}
        `;
        opinieLista.appendChild(opiniaDiv);
    });
}



// Powiększanie zdjęć w popupie
function openModal(imageUrl) {
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-image");
    modal.style.display = "block";
    modalImg.src = imageUrl;
}

// Zamknięcie modala
function closeModal() {
    document.getElementById("image-modal").style.display = "none";
}

async function pobierzSredniaOcene() {
    const response = await fetch("http://localhost:3000/api/opinie/srednia");
    const data = await response.json();
    const sredniaOcena = (typeof data.srednia === "number" && !isNaN(data.srednia)) ? data.srednia : 0;
    document.getElementById("avg-rating").innerText = sredniaOcena.toFixed(1);
}

// Dodanie modala do HTML
document.body.insertAdjacentHTML('beforeend', `
    <div id="image-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); text-align:center; z-index:1000;">
        <span onclick="closeModal()" style="position:absolute; top:20px; right:35px; color:white; font-size:40px; font-weight:bold; cursor:pointer;">&times;</span>
        <img id="modal-image" style="max-width:90%; max-height:90vh; margin-top:50px; border-radius:10px;">
    </div>
`);



document.getElementById("wyslij-opinie").addEventListener("click", async () => {
    const opiniaText = document.getElementById("opinia-text").value.trim();
    const opiniaImages = document.getElementById("opinia-image").files;

    if (!opiniaText || selectedRating === 0) {
        return alert("Wpisz treść opinii i wybierz ocenę!");
    }

    const sessionData = await checkSession();
    if (!sessionData.loggedIn) {
        return alert("Musisz być zalogowany, aby dodać opinię!");
    }

    const formData = new FormData();
    formData.append("content", opiniaText);
    formData.append("rating", selectedRating);
    formData.append("user_name", sessionData.name);

    for (const file of opiniaImages) {
        formData.append("images", file);
    }

    const response = await fetch("http://localhost:3000/api/opinie", {
        method: "POST",
        body: formData
    });

    const data = await response.json();
    if (data.success) {
        document.getElementById("opinia-text").value = "";
        document.getElementById("opinia-image").value = "";
        selectedRating = 0;
        resetStars();
        pobierzOpinie();
    } else {
        alert("Błąd podczas dodawania opinii!");
    }
});



