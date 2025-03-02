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
    const response = await fetch("https://domki-letniskowe-1.onrender.com/api/opinie");
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

        let imagesHTML = "";
        if (opinia.image_url) {
            let images;
            try {
                images = JSON.parse(opinia.image_url);
                if (!Array.isArray(images)) {
                    images = [images];
                }
            } catch (error) {
                images = [opinia.image_url];
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

function openModal(imageUrl) {
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-image");
    modal.style.display = "block";
    modalImg.src = imageUrl;
}

function closeModal() {
    document.getElementById("image-modal").style.display = "none";
}

async function pobierzSredniaOcene() {
    const response = await fetch("https://domki-letniskowe-1.onrender.com/api/opinie/srednia");
    const data = await response.json();
    const sredniaOcena = (typeof data.srednia === "number" && !isNaN(data.srednia)) ? data.srednia : 0;
    document.getElementById("avg-rating").innerText = sredniaOcena.toFixed(1);
}

document.body.insertAdjacentHTML('beforeend', `
    <div id="image-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); text-align:center; z-index:1000;">
        <span onclick="closeModal()" style="position:absolute; top:20px; right:35px; color:white; font-size:40px; font-weight:bold; cursor:pointer;">&times;</span>
        <img id="modal-image" style="max-width:90%; max-height:90vh; margin-top:50px; border-radius:10px;">
    </div>
`);

document.addEventListener("DOMContentLoaded", () => {
    const przyciskPokazFormularz = document.getElementById("pokaz-formularz-opinii");
    const formularzOpinie = document.getElementById("dodaj-opinie");

    przyciskPokazFormularz.addEventListener("click", () => {
        formularzOpinie.style.display = formularzOpinie.style.display === "none" ? "block" : "none";
    });
});

document.getElementById("wyslij-opinie").addEventListener("click", async () => {
    const opiniaText = document.getElementById("opinia-text").value.trim();
    const opiniaImages = document.getElementById("opinia-image").files;

    if (!opiniaText || selectedRating === 0) {
        return showToast("Wpisz treść opinii i wybierz ocenę!", "error");
    }

    const sessionData = await checkSession();
    if (!sessionData.loggedIn) {
        return showToast("Musisz być zalogowany, aby dodać opinię!", "error");
    }

    const formData = new FormData();
    formData.append("content", opiniaText);
    formData.append("rating", selectedRating);
    formData.append("user_name", sessionData.name);

    for (const file of opiniaImages) {
        formData.append("images", file);
    }

    const response = await fetch("https://domki-letniskowe-1.onrender.com/api/opinie", {
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
        showToast("Opinia dodana pomyślnie!", "success");
    } else {
        showToast("Błąd podczas dodawania opinii!", "error");
    }
});
