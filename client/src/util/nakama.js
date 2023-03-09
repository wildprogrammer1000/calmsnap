export const nakama = {
  client: null,
  session: null,
  socket: null,
};
nakama.refresh = () => {
  console.log("client", nakama.client);
  console.log("session", nakama.session);
  console.log("socket", nakama.socket);
};
nakama.set = (client, session, socket) => {
  if (!client || !session || !socket) return false;
  nakama.client = client;
  nakama.session = session;
  nakama.socket = socket;

  return true;
};

nakama.getAccount = async () => {
  const account = await nakama.client.getAccount(nakama.session);
  return account;
};
