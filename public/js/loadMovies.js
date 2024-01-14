let page = 1; 
const container = document.getElementById('movieContainer');

const loadMovies = async () => {
    try {
        const response = await fetch(`/loadMovies?page=${page}`);
        const movies = await response.json();

        if (movies.length === 0) {
            
            return;
        }

        container.innerHTML = '';
   
        const rowContainer = document.createElement('div');
        rowContainer.className = 'movie-row';
       movies.forEach(movie => {
            
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-square';
            movieCard.innerHTML = `
                <h1><a href="/movie/${movie._id}">${movie.title}</a></h1>
                <h2>Rating: ${movie.rating}</h2>
                <div class="poster-container">
                    <img src="${movie.posterUrl}" alt="${movie.title}" class="poster-image">
                </div>
            `;

            rowContainer.appendChild(movieCard);
             });

        container.appendChild(rowContainer);
        page++; 
    } catch (error) {
        console.error('Error loading movies:', error.message);
    }
};
window.addEventListener('scroll', () => {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const clientHeight = window.innerHeight;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
        loadMovies(); 
    }
});

loadMovies();
