const sql = require('mssql');

module.exports = async function (context, req) {
    const { title, year, genre, description, director, actors } = req.body;

    if (!title || !year || !genre || !description || !director || !actors) {
        context.res = {
            status: 400,
            body: "Missing parameters"
        };
        return;
    }

    try {
        const pool = await sql.connect(process.env.AzureSqlConnectionString);
        await pool.request()
            .input('Title', sql.NVarChar, title)
            .input('Year', sql.Int, year)
            .input('Genre', sql.NVarChar, genre)
            .input('Description', sql.NVarChar, description)
            .input('Director', sql.NVarChar, director)
            .input('Actors', sql.NVarChar, actors)
            .query(`INSERT INTO Movies (Title, Year, Genre, Description, Director, Actors) VALUES (@Title, @Year, @Genre, @Description, @Director, @Actors)`);

        context.res = {
            status: 200,
            body: "Movie added successfully"
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: `Error: ${err.message}`
        };
    }
};
