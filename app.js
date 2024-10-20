// Register functionality
document.getElementById('register-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch('http://localhost:3001/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const message = await response.text();
            alert(message);
            document.getElementById('register-form').reset();
        } else {
            const error = await response.text();
            alert(`Error: ${error}`);
        }
    } catch (error) {
        console.error('Error during registration:', error);
    }
});

// Login functionality
document.getElementById('login-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('http://localhost:3001/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const message = await response.text();
            alert(message);
            window.location.href = 'dashboard.html'; // Redirect to dashboard
        } else {
            const error = await response.text();
            alert(`Error: ${error}`);
        }
    } catch (error) {
        console.error('Error during login:', error);
    }
});

// Fetch and display books on the dashboard
async function fetchBooks() {
    try {
        const response = await fetch('http://localhost:3001/dashboard');
        if (response.ok) {
            const books = await response.json();
            const booksContainer = document.getElementById('books-container');
            booksContainer.innerHTML = ''; // Clear container

            books.forEach(book => {
                const bookDiv = document.createElement('div');
                bookDiv.textContent = `${book.title} by ${book.author} (${book.publicationYear})`;
                booksContainer.appendChild(bookDiv);
            });
        } else {
            console.error('Failed to fetch books');
        }
    } catch (error) {
        console.error('Error fetching books:', error);
    }
}

// Call fetchBooks on page load
fetchBooks();
