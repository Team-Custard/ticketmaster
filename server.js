const express = require('express');

const app = express();

app.get('/transcript/:channel/:message/:filename', async (req, res) => {
    const html = await fetch(`https://cdn.discordapp.com/attachments/${req.params.channel}/${req.params.message}/${req.params.filename}?${req.url.split('?')[1]}`).catch(() => {})
    if (!html) return res.send(400);
    res.send(await html.text());
})

app.listen(process.env["port"]);