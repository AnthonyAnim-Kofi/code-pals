// Simple confetti effect
export default function confetti() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const colors = ["#58CC02", "#1CB0F6", "#FF9600", "#FF4B4B", "#8B5CF6", "#FFD700"];

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const createConfettiPiece = () => {
    const confetti = document.createElement("div");
    confetti.style.cssText = `
      position: fixed;
      width: ${randomInRange(8, 14)}px;
      height: ${randomInRange(8, 14)}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${randomInRange(10, 90)}vw;
      top: -20px;
      border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
      pointer-events: none;
      z-index: 9999;
      animation: confetti-fall ${randomInRange(2, 4)}s linear forwards;
      transform: rotate(${randomInRange(0, 360)}deg);
    `;
    document.body.appendChild(confetti);

    setTimeout(() => confetti.remove(), 4000);
  };

  // Add keyframes if not already present
  if (!document.getElementById("confetti-styles")) {
    const style = document.createElement("style");
    style.id = "confetti-styles";
    style.textContent = `
      @keyframes confetti-fall {
        0% {
          transform: translateY(0) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh) rotate(720deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Create confetti burst
  const interval = setInterval(() => {
    if (Date.now() > animationEnd) {
      clearInterval(interval);
      return;
    }
    for (let i = 0; i < 5; i++) {
      createConfettiPiece();
    }
  }, 50);
}
