import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useParams } from "react-router-dom";
import type { Level } from "@kids/types";
import { levelRepo } from "../../services/level.repo";
import { RunPanel } from "../../components/RunPanel";
import { ErrorView, PageSkeleton } from "../../components/Feedback";
import type { RunAndJudgeResult } from "../../lib/runAndJudge";

interface LoadStateLoading {
  status: "loading";
}

interface LoadStateError {
  status: "error";
  message: string;
}

interface LoadStateReady {
  status: "ready";
  level: Level;
}

type LoadState = LoadStateLoading | LoadStateError | LoadStateReady;

export default function PlayPage() {
  const params = useParams();
  const levelId = params.levelId ?? "";
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadToken, setReloadToken] = useState(0);
  const [code, setCode] = useState("");
  const [runResult, setRunResult] = useState<RunAndJudgeResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!levelId) {
      setState({ status: "error", message: "未提供关卡 ID" });
      return;
    }

    (async () => {
      setState({ status: "loading" });
      try {
        const level = await levelRepo.getLevelById(levelId);
        if (cancelled) {
          return;
        }

        if (!level) {
          setState({ status: "error", message: `未找到关卡 ${levelId}` });
          return;
        }

        setState({ status: "ready", level });
        setCode(level.starter?.code ?? "");
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : "加载关卡失败";
        setState({ status: "error", message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [levelId, reloadToken]);

  if (state.status === "loading") {
    return <PageSkeleton rows={8} />;
  }

  if (state.status === "error") {
    return (
      <ErrorView
        title="关卡加载失败"
        message={state.message}
        actionLabel="重试"
        onAction={() => setReloadToken((token) => token + 1)}
      />
    );
  }

  const { level } = state;
  const graderConstraints = (level as any).grader?.constraints;
  const requiredStructures: string[] = Array.isArray(graderConstraints?.requireStructures)
    ? (graderConstraints.requireStructures as string[])
    : [];

  const visualization = useMemo(() => renderVisualization(level, runResult), [level, runResult]);

  return (
    <div className="grid" style={{ gap: 24 }}>
      <section className="card">
        <h1 className="page-title">{level.title}</h1>
        <p className="text-muted" style={{ marginBottom: 16 }}>
          {level.story || "欢迎来到新的编程挑战，试着完成目标吧！"}
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <strong>任务目标</strong>
            <ul>
              {level.goals.map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ul>
          </div>

          {level.hints && level.hints.length > 0 && (
            <div>
              <strong>提示</strong>
              <ul>
                {level.hints.map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ul>
            </div>
          )}

          {requiredStructures.length > 0 && (
            <div className="alert" style={{ borderColor: "rgba(31, 111, 230, 0.2)", background: "rgba(47, 138, 255, 0.08)" }}>
              <strong>结构要求</strong>
              <p style={{ marginTop: 8 }}>请在代码中包含：{requiredStructures.join("、")}</p>
            </div>
          )}
        </div>
      </section>

      <RunPanel
        level={level}
        code={code}
        onCodeChange={setCode}
        onResult={(result) => setRunResult(result)}
        gameRunner={{ render: () => visualization }}
      />
    </div>
  );
}

function renderVisualization(level: Level, result: RunAndJudgeResult | null): ReactNode {
  if (!result) {
    return <p className="text-muted">运行代码后可查看可视化结果。</p>;
  }

  switch (level.gameType) {
    case "io":
      return <IoVisualization level={level} result={result} />;
    case "pixel":
      return <PixelVisualization data={result.artifacts.pixelMatrix} />;
    case "music":
      return <MusicVisualization sequence={result.artifacts.musicSeq} />;
    default:
      return (
        <div className="text-muted">
          <p>该关卡暂未提供可视化展示。</p>
          <pre
            style={{
              marginTop: 8,
              whiteSpace: "pre-wrap",
              background: "rgba(15, 23, 42, 0.04)",
              padding: 12,
              borderRadius: 10,
            }}
          >
            {JSON.stringify(result.artifacts.raw ?? {}, null, 2)}
          </pre>
        </div>
      );
  }
}

function IoVisualization({ level, result }: { level: Level; result: RunAndJudgeResult }) {
  const cases = level.grader?.io?.cases ?? [];
  const ioCases = result.artifacts.ioCases ?? [];

  if (cases.length === 0) {
    return <p className="text-muted">该关卡没有提供示例输入输出。</p>;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {cases.map((item, index) => {
        const caseResult = ioCases[index];
        return (
          <div key={index} className="card" style={{ padding: 12, boxShadow: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span className="badge">测试 {index + 1}</span>
              <strong>{result.judge.passed ? "✓ 通过" : "⚠ 未通过"}</strong>
            </div>
            <pre style={ioBlockStyle}>输入：{item.in || "无"}</pre>
            <pre style={ioBlockStyle}>期望输出：{item.out}</pre>
            {caseResult && <pre style={ioBlockStyle}>实际输出：{caseResult.actual}</pre>}
            {result.exec.stdout && <pre style={ioBlockStyle}>控制台：{result.exec.stdout.trim()}</pre>}
          </div>
        );
      })}
    </div>
  );
}

const ioBlockStyle: CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  background: "rgba(15, 23, 42, 0.04)",
  padding: 8,
  borderRadius: 8,
  whiteSpace: "pre-wrap",
};

function PixelVisualization({ data }: { data?: number[][] }) {
  if (!data || data.length === 0) {
    return <p className="text-muted">暂无像素可视化数据。</p>;
  }

  const cols = Math.max(...data.map((row) => row.length));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 24px)`,
        gap: 4,
        justifyContent: "start",
      }}
    >
      {data.flatMap((row, y) =>
        Array.from({ length: cols }).map((_, x) => {
          const value = row[x] ?? 0;
          return (
            <div
              key={`${x}-${y}`}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: "1px solid rgba(15, 23, 42, 0.12)",
                background:
                  value > 0 ? `rgba(47, 138, 255, ${Math.min(value / 255, 1)})` : "rgba(15, 23, 42, 0.05)",
              }}
              aria-label={`像素 (${x}, ${y}) 值 ${value}`}
            />
          );
        }),
      )}
    </div>
  );
}

function MusicVisualization({
  sequence,
}: {
  sequence?: Array<{ pitch: string; duration: number }>;
}) {
  if (!sequence || sequence.length === 0) {
    return <p className="text-muted">暂无音乐可视化数据。</p>;
  }

  return (
    <div className="card" style={{ boxShadow: "none", padding: 16 }}>
      <p style={{ marginBottom: 12 }}>音符序列：</p>
      <ul style={{ listStyle: "disc", marginLeft: 20 }}>
        {sequence.map((note, index) => (
          <li key={`${note.pitch}-${index}`}>
            音符 {note.pitch}，时长 {note.duration.toFixed(2)}s
          </li>
        ))}
      </ul>
    </div>
  );
}
