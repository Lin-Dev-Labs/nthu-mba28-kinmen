import { useEffect, useState } from 'react';
import ProfileForm from '../components/ProfileForm';
import profileTemplate from '../data/profile-template.json';

const STORAGE_KEY = 'mba-profile';

export default function Home() {
  const [profile, setProfile] = useState(profileTemplate);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch (err) {
        console.warn('無法解析已儲存的個人資料', err);
      }
    }
  }, []);

  function handleChange(next) {
    setProfile(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 1000);
  }

  return (
    <section>
      <h1>個人資料</h1>
      <p>填寫完成後，前往「下載個人化PDF」頁面即可勾選課程與報告，一鍵生成學習歷程PDF。</p>
      <ProfileForm profile={profile} onChange={handleChange} />
      {saved && <p className="save-indicator">已自動儲存於瀏覽器</p>}
    </section>
  );
}
