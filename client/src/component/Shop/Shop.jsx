import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { nakama } from "../../util/nakama";
import { refresh } from "../../util/account";
import { cards } from "../../data/card";
import { jsConfetti } from "../../util/fn";
import style from "./Shop.module.css";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import LocalParkingIcon from "@mui/icons-material/LocalParking";

const Shop = () => {
  const account = useSelector((state) => state.default.value);
  const dispatch = useDispatch();
  const [wallet, setWallet] = useState({});

  const [card, setCard] = useState();
  const [point, setPoint] = useState();

  const tryDrawCard = async () => {
    console.log(nakama);
    const result = await nakama.socket.rpc("try_draw_card");
    if (!result || !result.payload) return;
    const payload = JSON.parse(result.payload);
    console.log(payload);
    if (payload.success) {
      payload.point && setPoint(payload.point);
      payload.card && setCard(payload.card);
      const account = await nakama.getAccount();
      dispatch(refresh(account));

      jsConfetti.addConfetti();
    }
  };

  useEffect(() => {
    account && setWallet(JSON.parse(account.wallet));
  }, [account]);
  useEffect(() => {
    return () => {
      setPoint(null);
      setCard(null);
    };
  }, []);
  if (!account) return;
  return (
    <>
      <div className={style.header}>
        <div className={style.ticket}>
          <ConfirmationNumberIcon className={style.ticket_img} />
          <span>{wallet.draw ? wallet.draw : 0}</span>
        </div>
        <div className={style.point}>
          <LocalParkingIcon />
          <span>{wallet.point ? wallet.point : 0}</span>
        </div>
        <div className={style.title}>Shop</div>
      </div>
      <div className={style.draw}>
        <img
          className={style.draw_img}
          src="card/draw.png"
          width="100%"
          alt="draw"
        />
        <div className={style.draw_button} onClick={tryDrawCard}>
          <ConfirmationNumberIcon className={style.ticket_img} />
          -1
        </div>
      </div>

      {point && (
        <div className={style.reward}>
          <div className={style.point_text}>
            <b>{point}</b> 포인트를 획득하였습니다!
          </div>
        </div>
      )}
      {card && (
        <div className={style.reward}>
          <div className={style.reward_text}>
            축하드립니다!
            <br />
            <b>"{cards[card]}"</b> 카드를 획득하였습니다!
          </div>
          <img src={`card/${card}.png`} width="100%" alt="card" />
        </div>
      )}
      {(point || card) && (
        <div
          className={style.background}
          onClick={() => {
            setCard(null);
            setPoint(null);
          }}
        ></div>
      )}
    </>
  );
};
export default Shop;
