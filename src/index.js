const express = require("express");
const { PrismaClient } = require("@prisma/client");
const http = require("http");
const cors = require("cors");

const prisma = new PrismaClient();
const app = express();

const PORT = 3500;

app.use(express.json());

app.options("*", cors());
app.use(cors());

const server = http.createServer(app);

server.listen(PORT, () => console.log(`server has started on port ${PORT}`)); // Server initialistation

// BASE OUTPUT
app.get("/", (req, res) =>
  res.json(`🚀 Server ready at: http://localhost:3000`)
);

app.post("/get", async (req, res) => {
  const accountId = req.body.accountId;

  const account = await prisma.account.findUnique({
    where: {
      id: accountId,
    },
  });

  if (account.admin === true) {
    const data = await prisma.parkschein.findMany({});
    res.json(data);
  } else {
    const data = await prisma.parkschein.findMany({
      where: {
        account: {
          some: {
            id: accountId,
          },
        },
      },
    });
    res.json(data);
  }
});

app.post("/getSpecific", async (req, res) => {
  const kennzeichen = req.body.kennzeichen;

  const data = await prisma.parkschein.findFirst({
    where: {
      kennzeichen: {
        equals: kennzeichen,
      },
    },
  });

  if (data === null) {
    res.json(false);
  } else res.json(data);
});

app.post("/login", async (req, res) => {
  const user = req.body.user;
  const password = req.body.password;

  const account = await prisma.account.findFirst({
    where: {
      username: user,
    },
  });

  const passwordTrue = account?.password === password;
  if (!passwordTrue) {
    return res.json({ error: true }).status(404);
  }
  res.json(account).status(200);
});

app.post("/create", async (req, res) => {
  const parkschein = req.body.kennzeichen;
  const accountId = req.body.accountId;

  const doesExist = await prisma.parkschein.findFirst({
    where: {
      kennzeichen: {
        equals: parkschein.kennzeichen,
      },
    },
  });

  if (doesExist === null) {
    const response = await prisma.parkschein.create({
      data: {
        kennzeichen: parkschein.kennzeichen,
        ort: parkschein.ort,
        datum: parkschein.datum,
        faellig: parkschein.faellig,
        account: {
          connect: {
            id: accountId,
          },
        },
      },
    });

    return res.status(201).json("Parkschein erfolgreich erstellt");
  } else {
    await prisma.parkschein.update({
      where: {
        id: doesExist.id,
      },
      data: {
        kennzeichen: parkschein.kennzeichen,
        ort: parkschein.ort,
        datum: parkschein.datum,
        faellig: parkschein.faellig,
      },
    });
    return res.status(201).send("Parkschein erfolgreich erneuert");
  }
});
