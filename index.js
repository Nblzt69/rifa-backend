
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const { randomUUID } = require('crypto');
dotenv.config();

app.use(cors({
  origin: "https://nblzt69.github.io/sorte-premium/", // seu frontend
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

const MP_TOKEN = process.env.MERCADO_PAGO_TOKEN;

// Cria cobrança Pix Mercado Pago
app.post("/api/pix", async (req, res) => {
  console.log("[POST] /api/pix chamada");
  console.log("Body recebido:", req.body);
  const { nome, email, telefone, valor, descricao } = req.body;
  try {
    const response = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      {
        transaction_amount: Number(valor),
        description: descricao || "Rifa Digital",
        payment_method_id: "pix",
        payer: {
          email: email,
          first_name: nome,
          identification: {
            type: "CPF",
            number: "00000000000" // Opcional, pode pedir do usuário
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${MP_TOKEN}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": randomUUID()
        }
      }
    );
    const pix = response.data.point_of_interaction.transaction_data;
    console.log("Cobrança Pix criada com sucesso!", pix);
    res.json({
      qr_code: pix.qr_code,
      qr_code_base64: pix.qr_code_base64,
      payment_id: response.data.id
    });
  } catch (err) {
    console.error("Erro ao criar cobrança Pix:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro ao criar cobrança Pix", details: err.response?.data || err.message });
  }
});

// Webhook para receber confirmação de pagamento
app.post("/api/webhook", (req, res) => {
  // Aqui você pode tratar notificações do Mercado Pago
  // Exemplo: atualizar status do pagamento, gerar números, etc.
  res.sendStatus(200);
});

// Consulta status do pagamento
app.get("/api/pix/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${id}`,
      { headers: { Authorization: `Bearer ${MP_TOKEN}` } }
    );
    res.json({ status: response.data.status });
  } catch (err) {
    res.status(500).json({ error: "Erro ao consultar pagamento", details: err.response?.data || err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Servidor backend rodando na porta " + PORT);
});



