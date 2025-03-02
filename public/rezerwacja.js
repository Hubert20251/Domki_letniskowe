document.addEventListener("DOMContentLoaded", async () => {
    await fetchHouses();
    await checkSession();
});

function showToast(message, type = "info") {
    const toastContainer = document.getElementById("toast-container") || createToastContainer();
    const toast = document.createElement("div");
    toast.classList.add("toast", type);
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

function createToastContainer() {
    const container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
    return container;
}

async function fetchHouses() {
    const user = await checkSession();
    const container = document.getElementById("houses-list");
    if (!container) {
        console.error("Błąd: Nie znaleziono elementu #houses-list. Sprawdź HTML.");
        return;
    }

    try {
        const response = await fetch("https://domki-letniskowe-1.onrender.com/api/houses");
        const data = await response.json();
        const uniqueHouses = [...new Map(data.map(house => [house.id, house])).values()];
        container.innerHTML = "";

        uniqueHouses.forEach(house => {
            const houseDiv = document.createElement("div");
            houseDiv.classList.add("house");
            houseDiv.setAttribute("data-house-id", house.id);

            let buttonHTML = user && user.loggedIn
                ? `<button class="reserve-button" data-house-id="${house.id}">Zarezerwuj</button>`
                : `<p class="login-message">Zaloguj się, aby zarezerwować</p>`;

            houseDiv.innerHTML = `
                <img src="${house.image_url || 'zdjecia/domek.jpg'}" alt="${house.name}" onerror="this.src='zdjecia/domek.jpg';">
                <h2>${house.name}</h2>
                <p>${house.description}</p>
                <p class="price"><strong>Cena:</strong> ${house.price} PLN/noc</p>
                ${buttonHTML}
            `;
            container.appendChild(houseDiv);
        });

        document.querySelectorAll(".reserve-button").forEach(button => {
            button.addEventListener("click", (event) => {
                if (!user || !user.loggedIn) {
                    showToast("Musisz być zalogowany, aby dokonać rezerwacji!", "error");
                    return;
                }
                const houseId = event.target.getAttribute("data-house-id");
                showReservationForm(houseId);
            });
        });

    } catch (error) {
        console.error("Błąd ładowania domków:", error);
    }
}

async function makeReservation(houseId, user_name, user_email, phone, dateFrom, dateTo, amount) {
    try {
        const response = await fetch("https://domki-letniskowe-1.onrender.com/api/book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ house_id: houseId, user_name, user_email, phone, date_from: dateFrom, date_to: dateTo, amount })
        });

        const data = await response.json();
        if (response.ok) {
            showToast("✅ Rezerwacja udana!", "success");
            await fetchHouses();
        } else {
            showToast("❌ Nie można zarezerwować: " + data.message, "error");
        }
    } catch (error) {
        console.error("❌ Błąd połączenia z serwerem:", error);
        showToast("Nie udało się połączyć z serwerem. Spróbuj ponownie później.", "error");
    }
}

async function showReservationForm(houseId) {
    const user = await checkSession();
    if (!user.loggedIn) {
        alert("Musisz być zalogowany, aby dokonać rezerwacji!");
        return;
    }

    const houseData = await fetch(`https://domki-letniskowe-1.onrender.com/api/houses`);
    const houses = await houseData.json();
    const house = houses.find(h => h.id == houseId);
    if (!house) {
        alert("Nie udało się pobrać danych domku!");
        return;
    }
    const housePrice = house.price;

    const overlay = document.createElement("div");
    overlay.classList.add("modal-overlay");
    document.body.appendChild(overlay);

    const reservationForm = document.createElement("div");
    reservationForm.classList.add("modal");
    reservationForm.innerHTML = `
        <h2>Rezerwacja domku</h2>
        <label for="house_id">Numer domu:</label>
        <input type="text" id="house_id" value="${houseId}" readonly>
        <label for="user_name">Imię i nazwisko:</label>
        <input type="text" id="user_name" required placeholder="Wpisz swoje imię i nazwisko">
        <label for="user_email">E-mail:</label>
        <input type="email" id="user_email" value="${user.email}" readonly required>
        <label for="dateFrom">Data od:</label>
        <input type="date" id="dateFrom" required>
        <label for="dateTo">Data do:</label>
        <input type="date" id="dateTo" required>
        <label for="phone">Numer telefonu:</label>
        <input type="text" id="phone" required placeholder="Wpisz numer telefonu">
        <label for="amount">Kwota:</label>
        <input type="number" id="amount" required readonly placeholder="Obliczona kwota">
        <button id="confirmReservation">Potwierdź</button>
        <button id="closeModal">Anuluj</button>
    `;

    document.body.appendChild(reservationForm);

    function updateAmount() {
        const dateFrom = document.getElementById("dateFrom").value;
        const dateTo = document.getElementById("dateTo").value;
        if (dateFrom && dateTo) {
            const startDate = new Date(dateFrom);
            const endDate = new Date(dateTo);
            const days = (endDate - startDate) / (1000 * 60 * 60 * 24);
            if (days > 0) {
                document.getElementById("amount").value = days * housePrice;
            } else {
                document.getElementById("amount").value = "";
            }
        }
    }

    document.getElementById("dateFrom").addEventListener("change", updateAmount);
    document.getElementById("dateTo").addEventListener("change", updateAmount);

    document.getElementById("confirmReservation").addEventListener("click", () => {
        const user_name = document.getElementById("user_name").value.trim();
        const user_email = document.getElementById("user_email").value.trim();
        const dateFrom = document.getElementById("dateFrom").value;
        const dateTo = document.getElementById("dateTo").value;
        const phone = document.getElementById("phone").value.trim();
        const amount = document.getElementById("amount").value.trim();
        
        if (!houseId || !user_name || !user_email || !phone || !dateFrom || !dateTo || !amount) {
            showToast("Proszę wypełnić wszystkie pola formularza.", "error");
            return;
        }
        
        makeReservation(houseId, user_name, user_email, phone, dateFrom, dateTo, amount);
        closeForm(reservationForm, overlay);
    });
    
    document.getElementById("closeModal").addEventListener("click", () => closeForm(reservationForm, overlay));
    
}

function closeForm(form, overlay) {
    document.body.removeChild(form);
    document.body.removeChild(overlay);
}
