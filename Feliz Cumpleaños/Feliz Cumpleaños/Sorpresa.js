

(() => {
  "use strict";

  const modalCarta = document.getElementById("modalCarta");
  const overlay = document.querySelector(".overlay");
  const regalo = document.querySelector(".regalo");
  const regalos = document.querySelector(".regalos");
  const vela = document.querySelector(".vela");
  const llama = document.querySelector(".llama");
  const audioSoplido = document.getElementById("soplido");
  const audioCancion = document.getElementById("cancion");

  const micState = {
    stream: null,
    context: null,
    analyser: null,
    rafId: null,
    blowFrames: 0,
  };

  function stopBreathDetection() {
    if (micState.rafId) {
      cancelAnimationFrame(micState.rafId);
      micState.rafId = null;
    }

    if (micState.analyser) {
      micState.analyser.disconnect();
      micState.analyser = null;
    }

    if (micState.context) {
      micState.context.close().catch(() => {});
      micState.context = null;
    }

    if (micState.stream) {
      micState.stream.getTracks().forEach((track) => track.stop());
      micState.stream = null;
    }

    micState.blowFrames = 0;
  }

  function startBreathDetection() {
    if (!navigator.mediaDevices?.getUserMedia || micState.context) {
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      .then((stream) => {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const context = new AudioCtx();
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;

        const source = context.createMediaStreamSource(stream);
        source.connect(analyser);

        micState.stream = stream;
        micState.context = context;
        micState.analyser = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const detect = () => {
          analyser.getByteFrequencyData(dataArray);
          const average =
            dataArray.reduce((sum, value) => sum + value, 0) /
            dataArray.length;

          if (average > 55) {
            micState.blowFrames += 1;
          } else {
            micState.blowFrames = 0;
          }

          if (micState.blowFrames >= 8) {
            cerrarCarta();
            stopBreathDetection();
            return;
          }

          micState.rafId = requestAnimationFrame(detect);
        };

        detect();
      })
      .catch(() => {
        stopBreathDetection();
      });
  }

  function abrirCarta() {
    modalCarta?.classList.add("activo");
    overlay?.classList.add("hidden");
    audioCancion?.play().catch(() => {});
    startBreathDetection();
  }

  function cerrarCarta() {
    modalCarta?.classList.remove("activo");
    overlay?.classList.remove("hidden");
    stopBreathDetection();
    if (audioCancion) {
      audioCancion.pause();
      audioCancion.currentTime = 0;
    }
  }

  [regalo, regalos].forEach((elemento) => {
    elemento?.addEventListener("click", (event) => {
      event.preventDefault();
      abrirCarta();
    });
  });

  modalCarta?.addEventListener("click", (event) => {
    if (event.target === modalCarta) {
      cerrarCarta();
    }
  });

  overlay?.addEventListener("click", cerrarCarta);

  [vela, llama].forEach((elemento) => {
    elemento?.addEventListener("click", () => {
      audioSoplido?.play().catch(() => {});
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      cerrarCarta();
    }
  });

  cerrarCarta();
})();
