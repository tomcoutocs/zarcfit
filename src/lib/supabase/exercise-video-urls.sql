-- ============================================
-- EXERCISE FORM VIDEO URLS
-- Run AFTER exercise-library-seed.sql
-- ============================================
-- Sets exercises.video_url for every seeded library exercise.
-- Prefer well-known instructional demos (Jeff Nippard, Athlean-X,
-- Scott Herman, Renaissance Periodization / Bret Contreras, etc.).
-- Safe to re-run — overwrites video_url by exact exercise name.
-- CA-102 expansion: also run exercise-video-urls-expansion.sql (300+ library).

-- Chest
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=vcBig73ojpE' WHERE name = 'Bench Press';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=8iPEnn-ltC8' WHERE name = 'Incline Dumbbell Press';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=IODxDxX7oi4' WHERE name = 'Push-Up';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=eozdVDA78K0' WHERE name = 'Chest Fly';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=taI4XduLpTk' WHERE name = 'Cable Crossover';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=2z8JmcrW-As' WHERE name = 'Dips';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=LfyQJYLKvQQ' WHERE name = 'Decline Bench Press';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=eGyd5t6t_kE' WHERE name = 'Pec Deck';

-- Back
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=ZaTM37cfiDs' WHERE name = 'Deadlift';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=sIvJTfGxdFo' WHERE name = 'Pull-Up';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=CAwf7n6Luuc' WHERE name = 'Lat Pulldown';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=kBWAon7ItNs' WHERE name = 'Barbell Row';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=GZbfZ033f74' WHERE name = 'Seated Cable Row';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=pYcpY20QaE8' WHERE name = 'Single-Arm Dumbbell Row';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=sIvJTfGxdFo' WHERE name = 'Wide-Grip Pull-Up';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=j3Igk5nyZE4' WHERE name = 'T-Bar Row';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=1uDTTyZwZQY' WHERE name = 'Straight-Arm Pulldown';

-- Legs
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=bEv6CCg2BC8' WHERE name = 'Squat';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=IZit57r0MUY' WHERE name = 'Leg Press';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=_oyxCn2iSjU' WHERE name = 'Romanian Deadlift';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=L1i7M0LvFL8' WHERE name = 'Walking Lunge';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=YyvSfVtQowg' WHERE name = 'Leg Extension';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=1Tq3QdYUuHs' WHERE name = 'Leg Curl';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=gwLzBJYoWlo' WHERE name = 'Calf Raise';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=2C-uNgKwPLE' WHERE name = 'Bulgarian Split Squat';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=LM8XHLYJoYs' WHERE name = 'Hip Thrust';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=MeIiIdrhGWo' WHERE name = 'Goblet Squat';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=EdtaJR3X_0I' WHERE name = 'Hack Squat';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=dQqApCGd5Ss' WHERE name = 'Step-Up';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=OUgsJNzsZhI' WHERE name = 'Glute Bridge';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=dI4eQKz8D3Y' WHERE name = 'Nordic Curl';

-- Shoulders
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=2yjwXTZQDDI' WHERE name = 'Overhead Press';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=qEwKCR5JCog' WHERE name = 'Dumbbell Shoulder Press';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=3VcKaXpzqRo' WHERE name = 'Lateral Raise';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=-t7fuZ0KhDA' WHERE name = 'Front Raise';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=ljgqer1ZpXg' WHERE name = 'Face Pull';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=6Z15_WdXmVw' WHERE name = 'Arnold Press';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=amCVPlM_eXc' WHERE name = 'Upright Row';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=JoCRRZ3zRtI' WHERE name = 'Reverse Fly';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=cJRVVxmytaM' WHERE name = 'Shrugs';

-- Arms
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=ykJmrZ5v0Pk' WHERE name = 'Bicep Curl';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=zC3xbLpSn2c' WHERE name = 'Hammer Curl';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=kwG2ipFng_U' WHERE name = 'Barbell Curl';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=2-LAMcpzODU' WHERE name = 'Tricep Pushdown';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=YbX7Wd8jQ1g' WHERE name = 'Overhead Tricep Extension';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=d_KZxkY_0cA' WHERE name = 'Skull Crusher';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=fI1ueUBCcy4' WHERE name = 'Preacher Curl';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=0AUGkch3tzc' WHERE name = 'Concentration Curl';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=nEF0bv2FC9A' WHERE name = 'Close-Grip Bench Press';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=vB5OHsV2ZmA' WHERE name = 'Rope Tricep Pushdown';

-- Core
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=ASdvN_XEl_c' WHERE name = 'Plank';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=Xyd_fa5zoEU' WHERE name = 'Crunch';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=hdng3Nm1z0E' WHERE name = 'Hanging Leg Raise';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=wkD8rjkodUI' WHERE name = 'Russian Twist';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=p47fEXGabaY' WHERE name = 'Ab Wheel Rollout';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=pAplQXk3dkU' WHERE name = 'Cable Woodchopper';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=g_tc_HQYPzk' WHERE name = 'Dead Bug';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=AH_QZLm_0-s' WHERE name = 'Pallof Press';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=K2VljzCC16g' WHERE name = 'Side Plank';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=nmwgirgXLYM' WHERE name = 'Mountain Climber';

-- Cardio / Full body
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=brFHyOtTwH4' WHERE name = 'Treadmill Run';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=zQ82RYIJz9o' WHERE name = 'Rowing Machine';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=mKDZI5p1ZWI' WHERE name = 'Kettlebell Swing';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=TU8QYVW0gDQ' WHERE name = 'Burpee';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=wJnhbTqU8lU' WHERE name = 'Battle Ropes';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=1BZM2Vre5oc' WHERE name = 'Jump Rope';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=pPJ_o1UqSyc' WHERE name = 'Assault Bike';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=Y1IrXFaW8oY' WHERE name = 'Stair Climber';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=p5QbbC1H_bI' WHERE name = 'Farmer Carry';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=TwDSI5JiQ6E' WHERE name = 'Medicine Ball Slam';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=NKR0_z8k_zY' WHERE name = 'Box Jump';
UPDATE exercises SET video_url = 'https://www.youtube.com/watch?v=MPs9b_OuW1k' WHERE name = 'Sled Push';
