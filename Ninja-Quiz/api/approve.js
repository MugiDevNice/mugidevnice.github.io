const axios = require("axios");

module.exports = async (req, res) => {

  // ✅ CORS (IMPORTANT pour Pi Browser)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(200).json({ ok: false, message: "Only POST allowed" });
  }

  try {
    const { paymentId } = req.body || {};

    if (!paymentId) {
      return res.status(400).json({ error: "paymentId missing" });
    }

    const response = await axios.post(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {},
      {
        headers: {
          Authorization: `Key ${process.env.PI_API_KEY}`
        }
      }
    );

    return res.status(200).json({
      success: true,
      data: response.data
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
};