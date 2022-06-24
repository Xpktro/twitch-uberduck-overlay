import { ApiClient } from "twitch";
import { StaticAuthProvider, RefreshableAuthProvider } from "twitch-auth";
import { PubSubClient } from "twitch-pubsub-client";
import { Howl } from "howler";

const CORS_PROXY = "https://try.readme.io/";

const log = (what) => {
  const node = document.createElement("p");
  node.innerHTML = what;
  document.body.appendChild(node);
};

window.onload = async () => {
  const token = JSON.parse(window.localStorage.getItem("token")) || {};
  const params = new URLSearchParams(window.location.search);
  const clientId = params.get("tid");
  const accessToken = token.accessToken || params.get("tat");
  const refreshToken = token.refreshToken || params.get("trt");
  const clientSecret = params.get("tcs");
  const uberduckKey = params.get("udk");
  const uberduckSecret = params.get("uds");
  const voicemap = (params.get("map") || "").split(",").reduce((r, voice) => {
    const [key, value] = voice.split(":");
    return { ...r, [key]: value };
  }, {});

  const uberduck = (voiceName, speech) => {
    const voice = voicemap[voiceName];
    if (!voice) return;
    fetch(`${CORS_PROXY}https://api.uberduck.ai/speak-synchronous`, {
      method: "POST",
      body: JSON.stringify({ speech, voice }),
      headers: {
        Authorization: `Basic ${btoa(uberduckKey + ":" + uberduckSecret)}`,
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const sound = new Howl({
          src: [url],
          format: ["wav"],
        });
        sound.play();
      })
      .catch(log);
  };

  window.localStorage.setItem(
    "token",
    JSON.stringify({
      ...(JSON.parse(window.localStorage.getItem("token")) || {}),
      accessToken,
      refreshToken,
    })
  );

  const authProvider = new RefreshableAuthProvider(
    new StaticAuthProvider(clientId, accessToken),
    {
      clientSecret,
      refreshToken,
      onRefresh: (token) => {
        const oldToken = JSON.parse(window.localStorage.getItem("token"));
        window.localStorage.setItem(
          "token",
          JSON.stringify({ ...oldToken, ...token })
        );
      },
    }
  );

  const apiClient = new ApiClient({ authProvider });
  const pubSubClient = new PubSubClient();
  const userId = await pubSubClient.registerUserListener(apiClient);
  pubSubClient.onRedemption(userId, ({ rewardName, message }) =>
    uberduck(rewardName, message)
  );
};
