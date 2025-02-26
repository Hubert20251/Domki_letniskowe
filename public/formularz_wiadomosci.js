document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("contactForm");
    if (!form) return; // Jeśli formularza nie ma, nie wykonujemy kodu

    form.addEventListener("submit", async function(event) {
        event.preventDefault();

        const formData = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            message: document.getElementById("message").value
        };

        try {
            const response = await fetch("http://localhost:3000/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const result = await response.text();
            alert(result); // Pokaż komunikat od serwera
        } catch (error) {
            console.error("Błąd wysyłania formularza:", error);
            alert("Wystąpił problem. Spróbuj ponownie.");
        }
    });
});
