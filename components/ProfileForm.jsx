import { useRef } from 'react';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfileForm({ profile, onChange }) {
  const fileInputRef = useRef(null);

  function update(field, value) {
    onChange({ ...profile, [field]: value });
  }

  function updateListItem(field, index, key, value) {
    const list = [...profile[field]];
    list[index] = { ...list[index], [key]: value };
    update(field, list);
  }

  function addListItem(field, empty) {
    update(field, [...profile[field], empty]);
  }

  function removeListItem(field, index) {
    const list = profile[field].filter((_, i) => i !== index);
    update(field, list);
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    update('photo', base64);
  }

  return (
    <form className="profile-form" onSubmit={(e) => e.preventDefault()}>
      <label>
        姓名
        <input
          type="text"
          value={profile.name}
          onChange={(e) => update('name', e.target.value)}
        />
      </label>

      <label>
        照片
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
        />
      </label>
      {profile.photo && !profile.photo.startsWith('/') && (
        <img src={profile.photo} alt="個人照片預覽" className="photo-preview" />
      )}

      <fieldset>
        <legend>學歷</legend>
        {profile.education.map((edu, i) => (
          <div key={i} className="list-row">
            <input
              placeholder="學校"
              value={edu.school}
              onChange={(e) => updateListItem('education', i, 'school', e.target.value)}
            />
            <input
              placeholder="學位"
              value={edu.degree}
              onChange={(e) => updateListItem('education', i, 'degree', e.target.value)}
            />
            <input
              placeholder="年份"
              value={edu.year}
              onChange={(e) => updateListItem('education', i, 'year', e.target.value)}
            />
            <button type="button" onClick={() => removeListItem('education', i)}>刪除</button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addListItem('education', { school: '', degree: '', year: '' })}
        >
          新增學歷
        </button>
      </fieldset>

      <fieldset>
        <legend>經歷</legend>
        {profile.experience.map((exp, i) => (
          <div key={i} className="list-row">
            <input
              placeholder="公司"
              value={exp.company}
              onChange={(e) => updateListItem('experience', i, 'company', e.target.value)}
            />
            <input
              placeholder="職稱"
              value={exp.title}
              onChange={(e) => updateListItem('experience', i, 'title', e.target.value)}
            />
            <input
              placeholder="期間"
              value={exp.period}
              onChange={(e) => updateListItem('experience', i, 'period', e.target.value)}
            />
            <input
              placeholder="描述"
              value={exp.desc}
              onChange={(e) => updateListItem('experience', i, 'desc', e.target.value)}
            />
            <button type="button" onClick={() => removeListItem('experience', i)}>刪除</button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addListItem('experience', { company: '', title: '', period: '', desc: '' })}
        >
          新增經歷
        </button>
      </fieldset>

      <label>
        自介
        <textarea
          rows={5}
          value={profile.bio}
          onChange={(e) => update('bio', e.target.value)}
        />
      </label>
    </form>
  );
}
