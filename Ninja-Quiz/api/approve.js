const axios = require("axios");

module.exports = async function handler(req, res) {
  // 1. Bloquer tout ce qui n'est pas POST
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Only POST allowed" });
  }

  // 2. Récupérer le paymentId envoyé par le frontend
  const { paymentId } = req.body;

  if (!paymentId) {
    return res.status(400).json({ ok: false, message: "paymentId is required" });
  }

  // 3. Vérifier que la clé API est bien présente côté serveur
  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) {
    console.error("PI_API_KEY is not set in environment variables");
    return res.status(500).json({ ok: false, message: "Server misconfiguration" });
  }

  try {
    // 4. Étape A : Approuver le paiement auprès de Pi Network
    const approveResponse = await axios.post(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {}, // body vide, le paymentId est dans l'URL
      {
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 15000, // 15 secondes max
      }
    );

    const payment = approveResponse.data;

    console.log(`Payment approved: ${paymentId}`, payment);

    // 5. Étape B : Compléter le paiement (complete) après livraison du bien
    //    Pour un quiz, la "livraison" est instantanée, donc on complete aussitôt.
    const completeResponse = await axios.post(
      `https://api.minepi.com/v2/payments/${paymentId}/complete`,
      { txid: payment.transaction?.txid || paymentId },
      {
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    console.log(`Payment completed: ${paymentId}`, completeResponse.data);

    return res.status(200).json({
      ok: true,
      message: "Payment approved and completed",
      payment: completeResponse.data,
    });

  } catch (error) {
    // 6. Log détaillé pour Vercel Observability
    if (error.response) {
      // Réponse reçue de api.minepi.com mais avec un code d'erreur
      console.error("Pi API error:", {
        status: error.response.status,
        data: error.response.data,
        paymentId,
      });
      return res.status(502).json({
        ok: false,
        message: "Pi API rejected the request",
        detail: error.response.data,
      });
    } else if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      // Timeout réseau
      console.error("Pi API timeout:", paymentId);
      return res.status(504).json({
        ok: false,
        message: "Pi API timeout — retry",
      });
    } else {
      // Autre erreur réseau
      console.error("Unexpected error:", error.message, paymentId);
      return res.status(500).json({
        ok: false,
        message: "Internal server error",
      });
    }
  }
};