export class MusicStrategy {
  name = 'music';
  judge(input) {
    const { expected, output, args = {} } = input;
    const musicArgs = {
      tempoTolerance: 2,
      onsetWindow: 0.05,
      durTolerance: 0.05,
      scoreThreshold: 0.85,
      pitchEquivalence: 'strict',
      ...args,
    };
    try {
      // 从 artifacts 中获取音乐序列
      const actualSequence = this.extractMusicSequence(output);
      if (!actualSequence) {
        return {
          passed: false,
          message: 'No music sequence found in execution output',
          details: 'Expected musicSeq in output.artifacts',
        };
      }
      const expectedSequence = expected;
      const warnings = [];
      // 检查节拍差异
      const tempoDiff = Math.abs(expectedSequence.tempo - actualSequence.tempo);
      if (tempoDiff > musicArgs.tempoTolerance) {
        warnings.push(
          `Tempo difference ${tempoDiff}BPM > tolerance ${musicArgs.tempoTolerance}BPM`,
        );
      }
      // 执行音乐序列比较
      const comparison = this.compareMusicSequences(expectedSequence, actualSequence, musicArgs);
      // 生成可视化数据
      const visualization = {
        expected: expectedSequence,
        actual: actualSequence,
        matchedNotes: comparison.matchedNotes,
        missingNotes: comparison.missingNotes,
        extraNotes: comparison.extraNotes,
        rhythmErrors: comparison.rhythmErrors,
        pitchErrors: comparison.pitchErrors,
      };
      return {
        passed: comparison.score >= musicArgs.scoreThreshold,
        message:
          comparison.score >= musicArgs.scoreThreshold
            ? 'Music sequence matches expected output'
            : `Music score ${(comparison.score * 100).toFixed(1)}% below threshold ${(musicArgs.scoreThreshold * 100).toFixed(1)}%`,
        details: `Score: ${(comparison.score * 100).toFixed(1)}%, Matched: ${comparison.matchedNotes.length}/${expectedSequence.notes.length}, Rhythm errors: ${comparison.rhythmErrors.length}, Pitch errors: ${comparison.pitchErrors.length}`,
        visualization,
        metrics: {
          score: comparison.score,
          matched: comparison.matchedNotes.length,
          total: expectedSequence.notes.length,
          rhythmErrorCount: comparison.rhythmErrors.length,
          pitchErrorCount: comparison.pitchErrors.length,
          onsetAvgErr: comparison.onsetAvgError,
        },
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        passed: false,
        message: 'Music comparison failed',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }
  extractMusicSequence(output) {
    // 优先从 artifacts 获取
    if (output.artifacts?.musicSeq) {
      return output.artifacts.musicSeq;
    }
    // 从 events 中解析音乐数据
    if (output.events) {
      return this.parseMusicEvents(output.events);
    }
    // 从 stdout 中解析
    if (output.stdout) {
      return this.parseMusicStdout(output.stdout);
    }
    return null;
  }
  parseMusicEvents(events) {
    const noteEvents = events.filter((e) => e.type === 'note');
    const tempoEvents = events.filter((e) => e.type === 'tempo');
    if (noteEvents.length === 0) return null;
    // 获取节拍
    let tempo = 120; // 默认节拍
    if (tempoEvents.length > 0) {
      tempo = tempoEvents[0].bpm || 120;
    }
    // 解析音符
    const notes = [];
    let currentTime = 0;
    for (const event of noteEvents) {
      const note = {
        pitch: event.pitch || 'C4',
        dur: event.dur || 0.5,
        start: event.start !== undefined ? event.start : currentTime,
      };
      notes.push(note);
      currentTime = note.start + note.dur;
    }
    return { tempo, notes };
  }
  parseMusicStdout(stdout) {
    // 查找 MUSIC_SEQ: 前缀的 JSON 数据
    const match = stdout.match(/MUSIC_SEQ:\s*(\{[\s\S]*?\})/);
    if (match) {
      try {
        const data = JSON.parse(match[1]);
        return data;
      } catch (error) {
        console.warn('Failed to parse MUSIC_SEQ JSON:', error);
      }
    }
    // 解析 note track pitch dur 格式
    const noteLines = stdout.split('\n').filter((line) => line.trim().startsWith('note '));
    const tempoLines = stdout.split('\n').filter((line) => line.trim().startsWith('tempo '));
    if (noteLines.length === 0) return null;
    // 获取节拍
    let tempo = 120;
    if (tempoLines.length > 0) {
      const parts = tempoLines[0].trim().split(/\s+/);
      tempo = parseInt(parts[1]) || 120;
    }
    // 解析音符
    const notes = [];
    let currentTime = 0;
    for (const line of noteLines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const note = {
          pitch: parts[2] || 'C4',
          dur: parseFloat(parts[3]) || 0.5,
          start: currentTime,
        };
        notes.push(note);
        currentTime += note.dur;
      }
    }
    return { tempo, notes };
  }
  compareMusicSequences(expected, actual, args) {
    const matchedNotes = [];
    const missingNotes = [];
    const extraNotes = [];
    const rhythmErrors = [];
    const pitchErrors = [];
    // 创建实际音符的副本用于匹配
    const actualNotes = [...actual.notes];
    let totalOnsetError = 0;
    let onsetErrorCount = 0;
    // 对每个期望音符进行匹配
    for (const expectedNote of expected.notes) {
      let bestMatch = null;
      let bestMatchIndex = -1;
      let bestScore = -1;
      // 找到最佳匹配
      for (let i = 0; i < actualNotes.length; i++) {
        const actualNote = actualNotes[i];
        const matchScore = this.calculateNoteMatchScore(expectedNote, actualNote, args);
        if (matchScore > bestScore) {
          bestScore = matchScore;
          bestMatch = actualNote;
          bestMatchIndex = i;
        }
      }
      if (bestMatch && bestScore > 0.5) {
        // 找到匹配
        matchedNotes.push(bestMatch);
        actualNotes.splice(bestMatchIndex, 1);
        // 检查错误类型
        if (this.isPitchMatch(expectedNote, bestMatch, args)) {
          // 音高匹配，检查节奏
          const timingError = Math.abs(expectedNote.start - bestMatch.start);
          const durationError = Math.abs(expectedNote.dur - bestMatch.dur);
          if (timingError > args.onsetWindow) {
            rhythmErrors.push({
              note: bestMatch,
              expected: expectedNote,
              error: 'timing',
              deviation: timingError,
            });
            totalOnsetError += timingError;
            onsetErrorCount++;
          }
          if (durationError > args.durTolerance) {
            rhythmErrors.push({
              note: bestMatch,
              expected: expectedNote,
              error: 'duration',
              deviation: durationError,
            });
          }
        } else {
          // 音高不匹配
          pitchErrors.push({
            note: bestMatch,
            expected: expectedNote,
            error: 'pitch',
          });
        }
      } else {
        // 没有找到匹配
        missingNotes.push(expectedNote);
      }
    }
    // 剩余的实际音符为多余音符
    extraNotes.push(...actualNotes);
    // 计算得分
    const totalExpected = expected.notes.length;
    const matched = matchedNotes.length;
    const score = totalExpected > 0 ? matched / totalExpected : 0;
    const onsetAvgError = onsetErrorCount > 0 ? totalOnsetError / onsetErrorCount : 0;
    return {
      score,
      matchedNotes,
      missingNotes,
      extraNotes,
      rhythmErrors,
      pitchErrors,
      onsetAvgError,
    };
  }
  calculateNoteMatchScore(expected, actual, args) {
    let score = 0;
    // 音高匹配 (40% 权重)
    if (this.isPitchMatch(expected, actual, args)) {
      score += 0.4;
    }
    // 起始时间匹配 (30% 权重)
    const timingError = Math.abs(expected.start - actual.start);
    if (timingError <= args.onsetWindow) {
      score += 0.3;
    } else {
      // 时间误差越大，得分越低
      const timingScore = Math.max(0, 0.3 - timingError / (args.onsetWindow * 2));
      score += timingScore;
    }
    // 时值匹配 (30% 权重)
    const durationError = Math.abs(expected.dur - actual.dur);
    if (durationError <= args.durTolerance) {
      score += 0.3;
    } else {
      // 时值误差越大，得分越低
      const durationScore = Math.max(0, 0.3 - durationError / (args.durTolerance * 2));
      score += durationScore;
    }
    return score;
  }
  isPitchMatch(expected, actual, args) {
    switch (args.pitchEquivalence) {
      case 'strict':
        return expected.pitch === actual.pitch;
      case 'ignoreOctave':
        return this.getPitchClass(expected.pitch) === this.getPitchClass(actual.pitch);
      case 'nearest':
        return this.getPitchDistance(expected.pitch, actual.pitch) <= 1;
      default:
        return expected.pitch === actual.pitch;
    }
  }
  getPitchClass(pitch) {
    // 提取音高类别（忽略八度）
    return pitch.replace(/\d+/, '');
  }
  getPitchDistance(pitch1, pitch2) {
    // 简化的音高距离计算
    const semitones1 = this.pitchToSemitones(pitch1);
    const semitones2 = this.pitchToSemitones(pitch2);
    return Math.abs(semitones1 - semitones2);
  }
  pitchToSemitones(pitch) {
    // 简化的音高到半音转换
    const noteMap = {
      C: 0,
      'C#': 1,
      Db: 1,
      D: 2,
      'D#': 3,
      Eb: 3,
      E: 4,
      F: 5,
      'F#': 6,
      Gb: 6,
      G: 7,
      'G#': 8,
      Ab: 8,
      A: 9,
      'A#': 10,
      Bb: 10,
      B: 11,
    };
    const match = pitch.match(/^([A-G][#b]?)(\d+)$/);
    if (!match) return 0;
    const [, note, octave] = match;
    const noteValue = noteMap[note] || 0;
    const octaveValue = parseInt(octave) || 4;
    return noteValue + (octaveValue - 4) * 12;
  }
}
