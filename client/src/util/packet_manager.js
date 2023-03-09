class PacketManager {
  constructor() {
    this.socket = null;
  }
  init(socket) {
    this.socket = socket;
    this.socket.onmatchdata = this.onmatchdata.bind(this);
  }
  onmatchdata(data) {
    console.log("on match data", data);
  }
}
export const packet_manager = new PacketManager();
