import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import style from "./test.module.css";
const Test = () => {
  const account = useSelector((state) => state.default.value);
  const canvasRef = useRef();
  const conRef = useRef();
  const [color, setColor] = useState("#000");
  const [thickness, setThickness] = useState(4);
  const [ctx, setCtx] = useState();
  const [userMetadata, setUserMetadata] = useState({});
  const [drawable, setDrawable] = useState(false);
  const [init, setInit] = useState(false);
  const onMouseDown = (ev) => {
    setDrawable(true);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.beginPath();
  };
  const onMouseMove = (ev) => {
    if (!canvasRef.current || !conRef.current || !drawable || !ctx) return;
    ctx.lineTo(
      ev.clientX -
        (canvasRef.current.offsetParent.offsetLeft -
          canvasRef.current.offsetParent.offsetWidth / 2),
      ev.clientY -
        (canvasRef.current.offsetParent.offsetTop -
          canvasRef.current.offsetParent.offsetHeight / 2)
    );
    ctx.stroke();
  };
  const onMouseUp = (ev) => {
    setDrawable(false);
  };
  const saveImage = () => {
    const canvasUrl = canvasRef.current.toDataURL("image/png");
    console.log(canvasUrl);
    const temp = document.createElement("a");
    temp.href = canvasUrl;
    temp.download = "download-this-canvas";
    temp.click();
    temp.remove();
  };
  useEffect(() => {
    if (!account) return;
    const metadata = JSON.parse(account.user.metadata);
    setUserMetadata(metadata);
    if (!metadata.character) setInit(true);
  }, [account]);
  useEffect(() => {
    if (init) {
      const currentCanvas = canvasRef.current;
      console.log("current canvas", currentCanvas);
      if (!currentCanvas) return;
      const temp = currentCanvas.getContext("2d");
      setCtx(temp);
    }
  }, [init]);
  return (
    <>
      {init && (
        <div className={style.init} ref={conRef}>
          <div className={style.init_title}>나의 캐릭터를 그려주세요!</div>
          <canvas
            width="300px"
            height="300px"
            ref={canvasRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            className={style.canvas}
          ></canvas>
          <div className={style.tools}>
            <div className={style.palette}>
              <div onClick={() => setColor("#f00")} className={style.red}></div>
              <div
                onClick={() => setColor("#ff0")}
                className={style.yellow}
              ></div>
              <div
                onClick={() => setColor("#00f")}
                className={style.blue}
              ></div>
              <div
                onClick={() => setColor("#000")}
                className={style.black}
              ></div>
              <div
                onClick={() => setColor("#fff")}
                className={style.white}
              ></div>
            </div>
            <div className={style.thickness}>
              <div
                className={style.thickness_2}
                onClick={() => setThickness(4)}
              ></div>
              <div
                className={style.thickness_4}
                onClick={() => setThickness(8)}
              ></div>
              <div
                className={style.thickness_8}
                onClick={() => setThickness(16)}
              ></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Test;
