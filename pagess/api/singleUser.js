// pages/api/insertData.js

import { Pool } from "pg";

// Create a new PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.SQLDATABASE_API_KEY,
});

export default async function handler(req, res) {
  try {
    const client = await pool.connect();
    // Insert data into the database
    const { id } = req.query;
    const queryText = "SELECT * FROM users WHERE id = $1";
    const result = await client.query(queryText, [id]);
    client.release();
    // Respond with the inserted data
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    // Handle errors
    console.error("Error Getting data into the database:", error);
    res.status(500).json({ success: false, error: "Failed to insert data into the database" });
  }
}
