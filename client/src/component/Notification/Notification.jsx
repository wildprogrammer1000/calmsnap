import { useState, useEffect } from "react";
import { nakama } from "../../util/nakama";
import style from "./Notification.module.css";

const Notification = ({ refreshAccount, close }) => {
  const code = {
    10: "친구초대 보상",
  };
  const [notifications, setNotifications] = useState([]);
  const getNotification = async () => {
    console.log("nakama", nakama);
    if (!nakama.client) return;
    const response = await nakama.client.listNotifications(nakama.session, 100);
    console.log("response", response);
    const temp = response.notifications.filter((el) => el.code === 10);

    temp.length && setNotifications(temp);
  };
  const getReward = async (code, noti_id, content) => {
    console.log("noti id", noti_id);
    if (!nakama.socket) return;
    const response = await nakama.socket.rpc(
      "get_reward_noti",
      JSON.stringify({ code: code, id: noti_id, content: content })
    );
    console.log("response", response);
    if (!response.payload) return;
    const payload = JSON.parse(response.payload);
    if (payload.success) {
      getNotification();
      refreshAccount();
    }
  };
  useEffect(() => {
    getNotification();
  }, []);
  return (
    <div className={style.container}>
      <div className={style.header}>
        <div>알림</div>
        <div onClick={close}>닫기</div>
      </div>
      <div>
        {notifications.length &&
          notifications.map((notification, index) => (
            <div
              key={`notification_${index}`}
              className={style.con_notification}
            >
              <div>{code[notification.code]}</div>
              <div className={style.con_reward}>
                {notification.content.point && (
                  <div>{notification.content.point}</div>
                )}
                <div
                  onClick={() =>
                    getReward(
                      notification.code,
                      notification.id,
                      notification.content
                    )
                  }
                >
                  받기
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
export default Notification;
