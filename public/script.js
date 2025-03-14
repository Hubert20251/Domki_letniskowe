document.addEventListener("DOMContentLoaded", async () => {
    await fetchHouses();
    await checkSession();
});

fetch("https://domki-letniskowe-1.onrender.com/api/session")
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


document.addEventListener("DOMContentLoaded", () => {
    // Obsługa Entera w formularzu rejestracji
    document.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            const registerModal = document.querySelector(".modal h2");
            if (registerModal && registerModal.innerText === "Rejestracja") {
                event.preventDefault(); // Zapobiega domyślnemu zachowaniu Entera
                document.getElementById("confirmRegister").click();
            }
            
            const loginModal = document.querySelector(".modal h2");
            if (loginModal && loginModal.innerText === "Logowanie") {
                event.preventDefault();
                document.getElementById("confirmLogin").click();
            }
        }
    });
});





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
            showToast("✅ Rejestracja udana! Możesz się teraz zalogować.", "success");
            nameField.value = "";
            emailField.value = "";
            passwordField.value = "";
        } else {
            showToast("⚠ Błąd rejestracji: " + data.message, "error");
        }
    })
    .catch(error => {
        console.error("❌ Błąd połączenia z serwerem:", error);
        alert("Błąd serwera. Spróbuj ponownie później.");
    });
}

function closeForm(form, overlay) {
    document.body.removeChild(form);
    document.body.removeChild(overlay);
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
        showToast("Zalogowano pomyślnie!", "success");
        
        // Aktualizacja sesji
        const sessionData = await checkSession();

        // Natychmiastowa aktualizacja UI
        updateUI(sessionData);

        await fetchHouses(); // Ponowne załadowanie domków, by odblokować przyciski
    } else {
        showToast("Błąd logowania: " + data.message, "error");
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



document.getElementById('logoutButton').addEventListener('click', async () => {
    await fetch('https://domki-letniskowe-1.onrender.com/api/logout', { method: 'POST' });
    
    await checkSession();
    await fetchHouses(); // Odświeżenie przycisków po wylogowaniu
    location.reload(); // Wymuszone odświeżenie strony
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






function showToast(message, type = "info") {
    const toastContainer = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.classList.add("toast", type);
    toast.innerText = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
