const sql = require('mssql');

module.exports = async function (context, myTimer) {
    try {
        const pool = await sql.connect(process.env.AzureSqlConnectionString);
        
        const result = await pool.request()
            .query(`
                SELECT MovieID, AVG(Rating) AS AvgRating
                FROM Reviews
                GROUP BY MovieID
            `);

        for (let row of result.recordset) {
            await pool.request()
                .input('MovieID', sql.Int, row.MovieID)
                .input('AvgRating', sql.Float, row.AvgRating)
                .query(`
                    MERGE INTO AverageRatings AS target
                    USING (SELECT @MovieID AS MovieID, @AvgRating AS AverageRating) AS source
                    ON (target.MovieID = source.MovieID)
                    WHEN MATCHED THEN
                        UPDATE SET AverageRating = source.AverageRating
                    WHEN NOT MATCHED THEN
                        INSERT (MovieID, AverageRating)
                        VALUES (source.MovieID, source.AverageRating);
                `);
        }

        context.log('Average ratings calculated successfully.');
    } catch (err) {
        context.log.error(`Error: ${err.message}`);
    }
};