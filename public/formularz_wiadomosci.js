document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("contactForm");
    if (!form) return; // Jeśli formularza nie ma, nie wykonujemy kodu

    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("contactEmail").value.trim();
        const message = document.getElementById("message").value.trim();

        if (!name || !email || !message) {
            showToast("Wszystkie pola są wymagane!", "error");
            return;
        }

        const formData = { name, email, message };

        try {
            const response = await fetch("https://domki-letniskowe.onrender.com/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const result = await response.text();
            showToast(result, "success"); // Pokaż komunikat od serwera

            form.reset(); // Wyczyść formularz po wysłaniu
        } catch (error) {
            console.error("Błąd wysyłania formularza:", error);
            showToast("Wystąpił problem. Spróbuj ponownie.", "error");
        }
    });
});
