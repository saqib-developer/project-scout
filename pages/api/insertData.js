// pages/api/insertData.js

import { Pool } from "pg";

// Create a new PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.SQLDATABASE_API_KEY,
});

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { id, name, username, status, filename, file, time } = req.body;

      const queryText =`
      INSERT INTO users (id, name, username, status, filename, file, time)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id)
      DO UPDATE SET
        name = $2,
        username = $3,
        status = $4,
        filename = $5,
        file = $6,
        time = $7
      RETURNING *`;
      const queryParams = [id, name, username, status, filename, file, time];
      const result = await pool.query(queryText, queryParams);

      // Respond with the inserted data
      res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
      // Handle errors
      console.error("Error inserting data into the database:", error);
      res.status(500).json({ success: false, error: "Failed to insert data into the database", queryParams });
    }
  } else {
    res.status(405).json({ success: false, error: "Method Not Allowed" });
  }
}
