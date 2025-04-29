import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.SQLDATABASE_API_KEY,
});

export default async function handler(req, res) {
  try {
    const client = await pool.connect();

    const query = "SELECT * FROM users";
    const result = await client.query(query);
    client.release();

    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error Getting data into the database:", error);
    res.status(500).json({ success: false, error: "Failed to insert data into the database" });
  }
}
