const sql = require('mssql');

module.exports = async function (context, req) {
    const query = req.query.query || '';

    try {
        const pool = await sql.connect(process.env.AzureSqlConnectionString);
        
        let moviesQuery;
        if (query) {
            moviesQuery = pool.request()
                .input('Query', sql.NVarChar, `%${query}%`)
                .query('SELECT * FROM Movies WHERE Title LIKE @Query');
        } else {
            moviesQuery = pool.request().query('SELECT * FROM Movies');
        }

        const movies = await moviesQuery;

        let result = [];

        for (let movie of movies.recordset) {
            const reviews = await pool.request()
                .input('MovieID', sql.Int, movie.MovieID)
                .query('SELECT Opinion, Rating, ReviewDate, Author FROM Reviews WHERE MovieID = @MovieID');

            const avgRatingResult = await pool.request()
                .input('MovieID', sql.Int, movie.MovieID)
                .query('SELECT AverageRating FROM AverageRatings WHERE MovieID = @MovieID');
            
            const avgRating = avgRatingResult.recordset.length ? avgRatingResult.recordset[0].AverageRating : null;

            result.push({
                Title: movie.Title,
                Year: movie.Year,
                Genre: movie.Genre,
                Description: movie.Description,
                Director: movie.Director,
                Actors: movie.Actors,
                AverageRating: avgRating,
                Reviews: reviews.recordset
            });
        }

        context.res = {
            status: 200,
            body: JSON.stringify(result),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: `Error: ${err.message}`
        };
    }
};