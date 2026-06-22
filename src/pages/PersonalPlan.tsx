import { useState, useRef } from 'react';
import { useAuth } from '../services/AuthContext';
import { useWorkoutPlans } from '../hooks/useWorkoutPlans';
import { CardSkeleton } from '../components/Skeleton';

const CANNED_PLANS: Record<string, { day: string; exercise: string; sets: number; reps: number }[]> = {
  '5-day split': [
    { day: 'Monday', exercise: 'Bench Press', sets: 4, reps: 8 },
    { day: 'Monday', exercise: 'Overhead Press', sets: 3, reps: 10 },
    { day: 'Monday', exercise: 'Lateral Raise', sets: 3, reps: 15 },
    { day: 'Tuesday', exercise: 'Deadlift', sets: 3, reps: 6 },
    { day: 'Tuesday', exercise: 'Barbell Row', sets: 4, reps: 8 },
    { day: 'Tuesday', exercise: 'Pull Up', sets: 3, reps: 8 },
    { day: 'Wednesday', exercise: 'Squat', sets: 4, reps: 8 },
    { day: 'Wednesday', exercise: 'Leg Press', sets: 3, reps: 12 },
    { day: 'Wednesday', exercise: 'Leg Curl', sets: 3, reps: 12 },
    { day: 'Thursday', exercise: 'Incline Bench', sets: 4, reps: 8 },
    { day: 'Thursday', exercise: 'Dumbbell Fly', sets: 3, reps: 12 },
    { day: 'Thursday', exercise: 'Tricep Pushdown', sets: 3, reps: 12 },
    { day: 'Friday', exercise: 'Romanian Deadlift', sets: 3, reps: 10 },
    { day: 'Friday', exercise: 'Leg Extension', sets: 3, reps: 12 },
    { day: 'Friday', exercise: 'Calf Raise', sets: 4, reps: 15 },
  ],
  '3-day full body': [
    { day: 'Monday', exercise: 'Squat', sets: 3, reps: 8 },
    { day: 'Monday', exercise: 'Bench Press', sets: 3, reps: 8 },
    { day: 'Monday', exercise: 'Barbell Row', sets: 3, reps: 8 },
    { day: 'Wednesday', exercise: 'Overhead Press', sets: 3, reps: 8 },
    { day: 'Wednesday', exercise: 'Deadlift', sets: 3, reps: 6 },
    { day: 'Wednesday', exercise: 'Pull Up', sets: 3, reps: 8 },
    { day: 'Friday', exercise: 'Squat', sets: 3, reps: 8 },
    { day: 'Friday', exercise: 'Incline Bench', sets: 3, reps: 8 },
    { day: 'Friday', exercise: 'Row', sets: 3, reps: 8 },
  ],
  'push-pull-legs': [
    { day: 'Monday', exercise: 'Bench Press', sets: 4, reps: 8 },
    { day: 'Monday', exercise: 'Overhead Press', sets: 3, reps: 10 },
    { day: 'Monday', exercise: 'Lateral Raise', sets: 3, reps: 15 },
    { day: 'Monday', exercise: 'Tricep Pushdown', sets: 3, reps: 12 },
    { day: 'Tuesday', exercise: 'Barbell Row', sets: 4, reps: 8 },
    { day: 'Tuesday', exercise: 'Pull Up', sets: 3, reps: 8 },
    { day: 'Tuesday', exercise: 'Face Pull', sets: 3, reps: 15 },
    { day: 'Tuesday', exercise: 'Bicep Curl', sets: 3, reps: 12 },
    { day: 'Thursday', exercise: 'Squat', sets: 4, reps: 8 },
    { day: 'Thursday', exercise: 'Romanian Deadlift', sets: 3, reps: 10 },
    { day: 'Thursday', exercise: 'Leg Press', sets: 3, reps: 12 },
    { day: 'Thursday', exercise: 'Calf Raise', sets: 4, reps: 15 },
    { day: 'Friday', exercise: 'Incline Bench', sets: 4, reps: 8 },
    { day: 'Friday', exercise: 'Arnold Press', sets: 3, reps: 10 },
    { day: 'Friday', exercise: 'Skull Crusher', sets: 3, reps: 12 },
    { day: 'Friday', exercise: 'Lateral Raise', sets: 3, reps: 15 },
  ],
};

export function PersonalPlan() {
  const { user } = useAuth();
  const { addPlan, removePlan, getPlansByDay, loading, DAYS } = useWorkoutPlans(user?.id ?? null);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [exerciseName, setExerciseName] = useState('');
  const [targetSets, setTargetSets] = useState('3');
  const [targetReps, setTargetReps] = useState('10');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAddExercise = async () => {
    if (!exerciseName || !targetSets || !targetReps) return;
    const existing = getPlansByDay(selectedDay);
    const dup = existing.find(e => e.exercise_name.toLowerCase() === exerciseName.toLowerCase());
    if (dup) {
      alert('Exercise already exists for this day');
      return;
    }
    await addPlan({
      exercise_name: exerciseName,
      day_of_week: selectedDay,
      target_sets: Number(targetSets),
      target_reps: Number(targetReps),
    });
    setExerciseName('');
  };

  const handleAiGenerate = () => {
    const key = Object.keys(CANNED_PLANS).find(k =>
      aiPrompt.toLowerCase().includes(k.toLowerCase())
    );
    if (key) {
      setAiResult(`Loaded "${key}" plan. Add it to your schedule?`);
      return;
    }
    if (aiPrompt.toLowerCase().includes('5 day')) {
      setAiResult('Try the "5-day split" plan (PPL + upper/lower).');
    } else if (aiPrompt.toLowerCase().includes('3 day')) {
      setAiResult('Try the "3-day full body" plan.');
    } else if (aiPrompt.toLowerCase().includes('push') || aiPrompt.toLowerCase().includes('pull') || aiPrompt.toLowerCase().includes('leg')) {
      setAiResult('Try the "push-pull-legs" plan.');
    } else {
      setAiResult('Available plans: "5-day split", "3-day full body", "push-pull-legs".');
    }
  };

  const handleApplyPlan = async (planName: string) => {
    const plan = CANNED_PLANS[planName];
    if (!plan) return;
    for (const item of plan) {
      const existing = getPlansByDay(item.day);
      const dup = existing.find(e => e.exercise_name.toLowerCase() === item.exercise.toLowerCase());
      if (!dup) {
        await addPlan({
          exercise_name: item.exercise,
          day_of_week: item.day,
          target_sets: item.sets,
          target_reps: item.reps,
        });
      }
    }
    setAiResult(null);
    setAiPrompt('');
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(data)) throw new Error('Invalid format');
        for (const item of data) {
          if (item.exercise_name && item.day_of_week) {
            const existing = getPlansByDay(item.day_of_week);
            const dup = existing.find((e: any) => e.exercise_name.toLowerCase() === item.exercise_name.toLowerCase());
            if (!dup) {
              await addPlan({
                exercise_name: item.exercise_name,
                day_of_week: item.day_of_week,
                target_sets: item.target_sets || 3,
                target_reps: item.target_reps || 10,
              });
            }
          }
        }
        alert('Workout plan uploaded!');
      } catch (err) {
        alert('Invalid file. Upload a JSON array with exercise_name, day_of_week fields.');
      }
    };
    reader.readAsText(file);
  };

  const currentExercises = getPlansByDay(selectedDay);

  return (
    <div className="page">
      <h1 className="page-title">Personal Plan</h1>

      <div className="card">
        <h2 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>AI Assistant</h2>
        <textarea
          value={aiPrompt}
          onChange={e => setAiPrompt(e.target.value)}
          placeholder='e.g. "help me build a 5 day a week plan"'
          rows={2}
          style={{ marginBottom: 8 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleAiGenerate}>Generate</button>
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>Upload</button>
        </div>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleUpload} />
        {aiResult && (
          <div style={{ marginTop: 8, padding: 8, background: 'var(--slate-800)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
            <p style={{ marginBottom: 6 }}>{aiResult}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.keys(CANNED_PLANS).map(name => (
                <button key={name} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => handleApplyPlan(name)}>
                  Apply {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading ? <CardSkeleton /> : (
        <>
          <div className="card">
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
              {DAYS.map(d => (
                <button
                  key={d}
                  className="btn btn-secondary"
                  style={{
                    flex: '0 0 auto', fontSize: '0.8rem', padding: '6px 12px',
                    background: selectedDay === d ? 'var(--orange-500)' : undefined,
                    color: selectedDay === d ? 'white' : undefined,
                  }}
                  onClick={() => setSelectedDay(d)}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>{selectedDay}</h2>
            {currentExercises.length === 0 && (
              <p style={{ fontSize: '0.875rem', color: 'var(--slate-400)' }}>No exercises planned</p>
            )}
            {currentExercises.map(ex => (
              <div key={ex.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: '1px solid var(--slate-700)',
              }}>
                <div>
                  <p style={{ fontWeight: 500 }}>{ex.exercise_name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>
                    {ex.target_sets} × {ex.target_reps}
                  </p>
                </div>
                <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => removePlan(ex.id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="card">
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>Add Exercise</h2>
            <input
              value={exerciseName}
              onChange={e => setExerciseName(e.target.value)}
              placeholder="Exercise name"
              style={{ marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label>Sets</label>
                <input type="number" value={targetSets} onChange={e => setTargetSets(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label>Reps</label>
                <input type="number" value={targetReps} onChange={e => setTargetReps(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAddExercise}>
              Add to {selectedDay}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
