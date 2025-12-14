"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const GRAVITY = 0.6;
const JUMP_VELOCITY = -12;
const OBSTACLE_SPEED = 4;
const OBSTACLE_INTERVAL = 1500; // ms

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [gameOver, setGameOver] = useState(false);

  // Dot state
  const dot = useRef({
    x: 50,
    y: 0,
    vy: 0,
    radius: 15,
    onGround: false,
  });

  // Obstacles
  const obstacles = useRef<Array<{ x: number; y: number; w: number; h: number }>>(
    []
  );
  const starsRef = useRef<Array<{ x: number; y: number; alpha: number }>>([]);

  // Timing
  const lastObstacleTime = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth * 0.9;
      canvas.height = window.innerHeight * 0.6;
      dot.current.y = canvas.height - dot.current.radius - 10;
      dot.current.onGround = true;
      // Generate stars for galaxy background
      starsRef.current = Array.from({ length: 200 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        alpha: Math.random() * 0.5 + 0.5,
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    const handleJump = () => {
      if (dot.current.onGround && !gameOver) {
        dot.current.vy = JUMP_VELOCITY;
        dot.current.onGround = false;
      }
    };
    window.addEventListener("keydown", handleJump);
    window.addEventListener("mousedown", handleJump);

    let animationFrameId: number;

    const update = (time: number) => {
      if (gameOver) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw galaxy background
      ctx.fillStyle = "#000022";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Draw stars
      starsRef.current.forEach((star) => {
        ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
        ctx.fillRect(star.x, star.y, 2, 2);
      });

      // Update dot
      dot.current.vy += GRAVITY;
      dot.current.y += dot.current.vy;

      if (dot.current.y >= canvas.height - dot.current.radius - 10) {
        dot.current.y = canvas.height - dot.current.radius - 10;
        dot.current.vy = 0;
        dot.current.onGround = true;
      }


      // Generate obstacles
      if (time - lastObstacleTime.current > OBSTACLE_INTERVAL) {
        const w = 20 + Math.random() * 30;
        const h = 20 + Math.random() * 40;
        obstacles.current.push({
          x: canvas.width,
          y: canvas.height - h - 10,
          w,
          h,
        });
        lastObstacleTime.current = time;
      }

      // Update obstacles
      obstacles.current.forEach((obs) => {
        obs.x -= OBSTACLE_SPEED;
      });
      // Draw dot
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.arc(dot.current.x, dot.current.y, dot.current.radius, 0, Math.PI * 2);
      ctx.fill();

      // Remove off-screen obstacles and increase score
      obstacles.current = obstacles.current.filter((obs) => {
        if (obs.x + obs.w < 0) {
          scoreRef.current++;
          setScore(scoreRef.current);
          return false;
        }
        return true;
      });

      // Collision detection
      obstacles.current.forEach((obs) => {
        if (
          dot.current.x + dot.current.radius > obs.x &&
          dot.current.x - dot.current.radius < obs.x + obs.w &&
          dot.current.y + dot.current.radius > obs.y
        ) {
          setGameOver(true);
        }
      });

      // Draw obstacles
      ctx.fillStyle = "#888888";
      obstacles.current.forEach((obs) => {
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      });

      // Draw score
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "20px Arial";
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 30);

      if (!gameOver) {
        animationFrameId = requestAnimationFrame(update);
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "30px Arial";
        ctx.fillText("Game Over", canvas.width / 2 - 80, canvas.height / 2);
        ctx.font = "20px Arial";
        ctx.fillText(`Final Score: ${scoreRef.current}`, canvas.width / 2 - 70, canvas.height / 2 + 30);
      }
    };

    animationFrameId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleJump);
      window.removeEventListener("mousedown", handleJump);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="border rounded" />
      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
          <Button onClick={() => window.location.reload()}>Restart</Button>
        </div>
      )}
    </div>
  );
}
