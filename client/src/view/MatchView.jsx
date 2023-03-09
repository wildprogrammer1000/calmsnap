import { useState, useEffect } from "react";
import { nakama } from "../util/nakama";
import { CircularProgress } from "@mui/material";
import { op_code } from "../data/op_code";
import { useSelector } from "react-redux";
import { ability } from "../data/card";

import style from "./View.module.css";
import CloseIcon from "@mui/icons-material/Close";
import LocalParkingIcon from "@mui/icons-material/LocalParking";

let match_timeout;
const MatchView = ({ setView, refreshAccount }) => {
  // idle, connecting, waiting, matching, aborted
  const account = useSelector((state) => state.default.value);
  const [state, setState] = useState("idle");
  const [players, setPlayers] = useState([]);
  const [matchDetected, setMatchDetected] = useState(false);

  const [gameInfo, setGameInfo] = useState();
  const [finishTurn, setFinishTurn] = useState(false);
  const [focus, setFocus] = useState();
  const [collectTarget, setCollectTarget] = useState();
  const [selected, setSelected] = useState();

  const [runtime, setRuntime] = useState();
  const [reward, setReward] = useState();
  const [winner, setWinner] = useState();
  const [resultPopup, setResultPopup] = useState(false);

  const findMatch = async () => {
    const response = await nakama.socket.rpc("matching");
    if (response.payload) {
      nakama.match_id = response.payload;
      nakama.socket.joinMatch(response.payload);
    }
  };
  const leaveMatch = async () => {
    if (!nakama.match_id) {
      if (match_timeout) {
        clearTimeout(match_timeout);
        match_timeout = null;
        setView(1);
        setPlayers([]);
        setMatchDetected(false);
      }
      return;
    }
    const result = await nakama.socket.leaveMatch(nakama.match_id);
    if (result.cid) {
      setView(1);
      setPlayers([]);
      setMatchDetected(false);
      nakama.match_id = null;
    }
  };
  const showPlayer = () => {
    const other_player = players.find(
      (player) => player.user_id !== account.user.id
    );
    return <div>{other_player.username}</div>;
  };

  const showPower = (players, my_id, area) => {
    let my_cards = [];
    let counter_cards = [];
    players.forEach((player) => {
      if (player.user_id === my_id) {
        if (area[player.user_id]) my_cards = area[player.user_id];
      } else {
        if (area[player.user_id]) counter_cards = area[player.user_id];
      }
    });
    // console.log("ability", ability);
    let my_power = 0;
    let counter_power = 0;

    my_cards.forEach((card) => (my_power += ability[card].power));
    counter_cards.forEach((card) => (counter_power += ability[card].power));
    return (
      <div
        className={
          my_power !== counter_power && my_power > counter_power
            ? style.stronger_area
            : style.normal_area
        }
      >
        {my_power}
      </div>
    );
  };
  const showName = (name) => {
    let counter = null;
    Object.keys(name).forEach((id, index) => {
      if (id !== account.user.id) counter = name[id];
    });
    return counter;
  };
  const checkPlayer = () => {
    const other_player = players.find(
      (player) => player.user_id !== account.user.id
    );
    if (other_player) return true;
    return false;
  };
  const playCard = async (index, selected) => {
    if (!nakama.socket) return;
    nakama.socket.sendMatchState(
      nakama.match_id,
      op_code.PLAY_CARD,
      JSON.stringify({
        area: index,
        card: selected,
      })
    );
  };
  const collectCard = async (target) => {
    if (!nakama.socket) return;
    nakama.socket.sendMatchState(
      nakama.match_id,
      op_code.COLLECT_CARD,
      JSON.stringify(target)
    );
  };

  const showMap = () => {
    return Object.values(runtime.map).map((area, index) => (
      <div key={`${area}_${index}`} className={style.map}>
        <div>area_{index}</div>
        {players.map((player) =>
          player.user_id === account.user.id ? (
            <div
              key={`${player.user_id}_${index}`}
              className={selected ? style.my_field_on : style.my_field_off}
              onClick={() => {
                selected && playCard(index, selected);
              }}
            >
              <div className={style.my_power}>
                {showPower(players, player.user_id, area)}
              </div>
              {area[player.user_id] &&
                area[player.user_id].map((card, index_2) => (
                  <img
                    // onClick={() => setCollectTarget({ area: index, card: card })}
                    key={`card_${index_2}`}
                    height="100%"
                    alt="card"
                    src={`card/${card}.png`}
                  />
                ))}
            </div>
          ) : (
            <div
              key={`${player.user_id}_${index}`}
              className={style.counter_field}
            >
              <div className={style.counter_power}>
                {showPower(players, player.user_id, area)}
              </div>
              {area[player.user_id] &&
                area[player.user_id].map((card, index_2) => (
                  <img
                    // onClick={() => setCollectTarget({ area: index, card: card })}
                    key={`card_${index_2}`}
                    height="100%"
                    alt="card"
                    src={`card/${card}.png`}
                  />
                ))}
            </div>
          )
        )}
      </div>
    ));
  };
  const finishThisTurn = async () => {
    // console.log("finish turn");
    if (!nakama.socket) return;
    if (!finishTurn) {
      nakama.socket.sendMatchState(nakama.match_id, op_code.FINISH_TURN);
      setFinishTurn(true);
      setSelected(null);
    }
  };
  const onMatchInit = (data) => {
    const players = data.players;
    const temp = [];
    Object.keys(players).length > 0 &&
      Object.values(players).forEach((player) => {
        if (player.user_id !== account.user.id) temp.push(player);
      });

    setPlayers((state) => [...state, ...temp]);
    // console.log("match init", data, nakama.match_id);
    nakama.socket.sendMatchState(
      nakama.match_id,
      op_code.PLAYER_JOIN,
      JSON.stringify({})
    );
  };
  const onMatchReady = (data) => {
    setMatchDetected(true);
    setTimeout(async () => {
      nakama.socket.sendMatchState(nakama.match_id, op_code.PLAYER_READY);
    }, 3000);
    // console.log("match start", data);
  };
  const onMatchStart = (data) => {
    // console.log("match started", data);
    setState("play");
    setGameInfo(data.game_info);
    setRuntime(data.runtime);
  };
  const onMatchAborted = (data) => {
    // console.log("aborted", data);
    setState("aborted");
    setReward(data);
  };
  const onTurnPassed = (data) => {
    setFinishTurn(false);
    // console.log("turn passed", data);
    setGameInfo(data);
    setRuntime(data);
    const map = data.map;
    Object.values(map).forEach((area) => {});
  };
  const onPlayCard = (data) => {
    // console.log("play card", data, runtime, gameInfo);
    const targetArea = `area_${data.area + 1}`;
    // console.log("targetArea", targetArea);
    const currentMap = runtime.map;
    if (currentMap[targetArea][data.user_id])
      currentMap[targetArea][data.user_id].push(data.card);
    else currentMap[targetArea][data.user_id] = [data.card];
    setSelected(null);
    setRuntime((state) => {
      return { ...state, map: currentMap };
    });

    setGameInfo((state) => {
      return {
        ...state,
        card: state.card.filter((el) => el !== data.card),
        energy: data.energy,
      };
    });
  };
  const onMatchResult = (data) => {
    console.log("match result", data);
    setWinner(data.winner);
    setResultPopup(true);
  };
  const onRequestReward = (data) => {
    setState("reward");
    setReward(data);
    setWinner(null);
  };
  const requestReward = async () => {
    if (!nakama.socket) return;
    nakama.socket.sendMatchState(nakama.match_id, op_code.REQUEST_REWARD);
  };
  const onmatchdata = (data) => {
    const code = data.op_code;
    const decoder = new TextDecoder();
    const decoded_data = data.data
      ? JSON.parse(decoder.decode(data.data))
      : null;

    switch (code) {
      case op_code.MATCH_INIT:
        onMatchInit(decoded_data);
        break;
      case op_code.MATCH_READY:
        onMatchReady(decoded_data);
        break;
      case op_code.MATCH_START:
        onMatchStart(decoded_data);
        break;
      case op_code.MATCH_ABORTED:
        onMatchAborted(decoded_data);
        break;
      case op_code.TURN_PASSED:
        onTurnPassed(decoded_data);
        break;
      case op_code.PLAY_CARD:
        onPlayCard(decoded_data);
        break;
      case op_code.MATCH_RESULT:
        onMatchResult(decoded_data);
        break;
      case op_code.REQUEST_REWARD:
        onRequestReward(decoded_data);
        break;
      default:
        console.log("not defined opcode", code);
    }
  };
  const onmatchpresence = (data) => {
    // console.log("on match presence", data);
    const joins = data.joins;
    joins && setPlayers((state) => [...state, ...joins]);
    const leaves = data.leaves;
    if (leaves) {
      setMatchDetected(false);
      setPlayers((state) => {
        let temp = state;
        // console.log(temp);
        leaves.forEach(
          (leave) => (temp = temp.filter((el) => el.user_id !== leave.user_id))
        );
        return temp;
      });
    }
  };
  useEffect(() => {
    // console.log("players", players);
  }, [players]);
  useEffect(() => {
    findMatch();
  }, []);
  useEffect(() => {
    nakama.socket.onmatchdata = onmatchdata;
    nakama.socket.onmatchpresence = onmatchpresence;
  });
  useEffect(() => {
    // console.log("info changed", gameInfo);
  }, [gameInfo]);
  return (
    <>
      {state === "idle" && (
        <div className={style.wrapper}>
          <div className={style.matchview_header}>
            <div className={style.matchview_title}>
              {!matchDetected ? "매치 메이킹 중" : "게임 접속 중"}
            </div>
          </div>
          <div className={style.matchview_body}>
            <div className={style.info}>{account.user.username}</div>
            {checkPlayer() ? (
              <div className={style.info}>{showPlayer()}</div>
            ) : (
              <div className={style.find_text}>상대 찾는 중...</div>
            )}
          </div>
          <div className={style.footer}>
            <div className={style.cancel} onClick={leaveMatch}>
              취소
            </div>
          </div>
          <div className={style.loading}>
            <div className={style.loading_text}>VS</div>
            <CircularProgress
              style={{ width: 60, height: 60, color: "#000" }}
            />
          </div>
        </div>
      )}
      {state === "play" && (
        <div className={style.play_container}>
          <div className={style.top_panel}>
            <div>{account.user.username}</div>
            <div>{gameInfo.turn ? gameInfo.turn : "loading"}</div>
            <div>{gameInfo.name ? showName(gameInfo.name) : "loading"}</div>
          </div>
          <div className={style.field}>{runtime.map && showMap()}</div>
          <div className={style.card_container}>
            {gameInfo.card
              ? gameInfo.card.map((card, index) => (
                  <div
                    key={`card_${index}`}
                    className={style.card}
                    onClick={() => setFocus(card)}
                  >
                    <div className={style.square_cost}>
                      <div className={style.card_cost}>
                        <div>{ability[card].cost}</div>
                      </div>
                    </div>
                    <div className={style.square_power}>
                      <div className={style.card_power}>
                        <div>{ability[card].power}</div>
                      </div>
                    </div>
                    <img height="100%" alt="card" src={`card/${card}.png`} />
                  </div>
                ))
              : "loading"}
          </div>
          <div className={style.bottom_panel}>
            <div onClick={leaveMatch}>Exit</div>
            <div>{gameInfo ? gameInfo.energy : "loading"}</div>
            {winner ? (
              winner === account.user.id ? (
                <div onClick={requestReward}>보상받기</div>
              ) : (
                <div onClick={leaveMatch}>나가기</div>
              )
            ) : (
              <div
                className={finishTurn ? style.turn_off : style.turn_on}
                onClick={finishThisTurn}
              >
                Finish Turn
              </div>
            )}
          </div>
          {resultPopup && winner && (
            <div className={style.background}>
              <div className={style.result_container}>
                <div className={style.result_title}>
                  {winner === account.user.id ? "승리" : "패배"}
                </div>
                <div
                  className={style.button_confirm}
                  onClick={() => setResultPopup(false)}
                >
                  확인
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {state === "aborted" && (
        <div className={style.background}>
          <div className={style.reward}>
            <div className={style.reward_title}>상대가 나갔습니다.</div>
            {reward && (
              <div className={style.reward_con}>
                <div className={style.reward_subtitle}>보상</div>
                <div className={style.reward_point}>
                  <LocalParkingIcon />
                  {reward.point}
                </div>
              </div>
            )}
            <div
              className={style.reward_close}
              onClick={() => {
                leaveMatch();
                setReward(null);
                refreshAccount();
              }}
            >
              나가기
            </div>
          </div>
        </div>
      )}
      {state === "reward" && (
        <div className={style.background}>
          <div className={style.reward}>
            {reward && (
              <div className={style.reward_con}>
                <div className={style.reward_subtitle}>보상</div>
                <div className={style.reward_point}>
                  <LocalParkingIcon />
                  {reward.point}
                </div>
              </div>
            )}
            <div
              className={style.reward_close}
              onClick={() => {
                leaveMatch();
                setReward(null);
                refreshAccount();
              }}
            >
              나가기
            </div>
          </div>
        </div>
      )}
      {focus && (
        <div className={style.background}>
          <div className={style.focus_card}>
            <div className={style.square_cost}>
              <div className={style.card_cost}>
                <div>{ability[focus].cost}</div>
              </div>
            </div>
            <div className={style.square_power}>
              <div className={style.card_power}>
                <div>{ability[focus].power}</div>
              </div>
            </div>
            <img alt="card" src={`card/${focus}.png`} width="100%" />
            <div className={style.button_container}>
              <div
                className={style.play}
                onClick={() => {
                  setSelected(focus);
                  setFocus(null);
                }}
              >
                내기
              </div>
              <CloseIcon
                className={style.close}
                onClick={() => setFocus(null)}
              />
            </div>
          </div>
        </div>
      )}
      {collectTarget && (
        <div className={style.background}>
          <div className={style.focus_card}>
            <img
              alt="card"
              src={`card/${collectTarget.card}.png`}
              width="100%"
            />
            <div className={style.button_container}>
              <div
                className={style.play}
                onClick={() => collectCard(collectTarget)}
              >
                내기
              </div>
              <CloseIcon
                className={style.close}
                onClick={() => setCollectTarget(null)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default MatchView;
