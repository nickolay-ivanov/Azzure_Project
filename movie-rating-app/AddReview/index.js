const sql = require('mssql');

module.exports = async function (context, req) {
    const { title, opinion, rating, review_date, author } = req.body;

    if (!title || !opinion || !rating || !review_date || !author) {
        context.res = {
            status: 400,
            body: "Missing parameters"
        };
        return;
    }

    try {
        const pool = await sql.connect(process.env.AzureSqlConnectionString);
        const result = await pool.request()
            .input('Title', sql.NVarChar, title)
            .query('SELECT MovieID FROM Movies WHERE Title = @Title');
        
        if (result.recordset.length === 0) {
            context.res = {
                status: 404,
                body: "Movie not found"
            };
            return;
        }

        const movieId = result.recordset[0].MovieID;
        
        await pool.request()
            .input('MovieID', sql.Int, movieId)
            .input('Opinion', sql.NVarChar, opinion)
            .input('Rating', sql.Int, rating)
            .input('ReviewDate', sql.DateTime, review_date)
            .input('Author', sql.NVarChar, author)
            .query(`INSERT INTO Reviews (MovieID, Opinion, Rating, ReviewDate, Author) VALUES (@MovieID, @Opinion, @Rating, @ReviewDate, @Author)`);

        context.res = {
            status: 200,
            body: "Review added successfully"
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: `Error: ${err.message}`
        };
    }
};
