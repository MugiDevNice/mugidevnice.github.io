const axios = require("axios");

module.exports = async (req, res) => {

  console.log("APPROVE CALLED");
  console.log("BODY =", req.body);

  if (req.method !== "POST") {
    return res.status(200).json({
      ok: false,
      message: "Only POST allowed"
    });
  }

  try {

    const { paymentId } = req.body;

    console.log("PAYMENT ID =", paymentId);
    console.log("PI_API_KEY EXISTS =", !!process.env.PI_API_KEY);

    const response = await axios.post(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {},
      {
        headers: {
          Authorization: `Key ${process.env.PI_API_KEY}`
        }
      }
    );

    console.log("PI RESPONSE =", response.data);

    return res.status(200).json({
      ok: true,
      data: response.data
    });

  } catch (err) {

    console.error("PI ERROR =", err.response?.data || err.message);

    return res.status(500).json({
      ok: false,
      error: err.response?.data || err.message
    });
  }
};