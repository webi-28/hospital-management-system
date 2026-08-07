import React, { useState } from 'react';
import { FiUser, FiLock, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    full_name:  user?.full_name  || '',
    phone:      user?.phone      || '',
    avatar_url: user?.avatar_url || '',
  });
  const [pwdForm, setPwdForm] = useState({
    current_password: '', new_password: '', confirm_password: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd,     setSavingPwd]     = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/update-profile', profileForm);
      updateUser(data.data);
      toast.success('Profile updated.');
    } catch { toast.error('Update failed.'); }
    finally { setSavingProfile(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      toast.error('Passwords do not match.'); return;
    }
    setSavingPwd(true);
    try {
      await api.put('/auth/change-password', {
        current_password: pwdForm.current_password,
        new_password: pwdForm.new_password,
      });
      toast.success('Password changed.');
      setPwdForm({ current_password:'', new_password:'', confirm_password:'' });
    } catch { toast.error('Password change failed.'); }
    finally { setSavingPwd(false); }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Profile Settings</h1>
      </div>

      <div className="profile-grid">
        {/* Avatar card */}
        <Card className="profile-avatar-card">
          <div className="profile-avatar-section">
            {user?.avatar_url
              ? <img src={user.avatar_url} alt={user.full_name} className="profile-avatar-img" />
              : <div className="profile-avatar-placeholder">{user?.full_name?.[0]?.toUpperCase()}</div>
            }
            <h3>{user?.full_name}</h3>
            <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
            <p>{user?.email}</p>
          </div>
        </Card>

        <div className="profile-forms">
          {/* Edit profile */}
          <Card title={<><FiUser /> Personal Information</>}>
            <form onSubmit={handleProfileSave}>
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-control" value={profileForm.full_name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input className="form-control" value={profileForm.phone}
                  onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Avatar URL</label>
                <input type="url" className="form-control" value={profileForm.avatar_url}
                  placeholder="https://example.com/photo.jpg"
                  onChange={(e) => setProfileForm((p) => ({ ...p, avatar_url: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? 'Saving…' : <><FiSave /> Save Changes</>}
              </button>
            </form>
          </Card>

          {/* Change password */}
          <Card title={<><FiLock /> Change Password</>} className="mt-4">
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" className="form-control"
                  value={pwdForm.current_password}
                  onChange={(e) => setPwdForm((p) => ({ ...p, current_password: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" className="form-control"
                  value={pwdForm.new_password}
                  onChange={(e) => setPwdForm((p) => ({ ...p, new_password: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" className="form-control"
                  value={pwdForm.confirm_password}
                  onChange={(e) => setPwdForm((p) => ({ ...p, confirm_password: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingPwd}>
                {savingPwd ? 'Changing…' : 'Change Password'}
              </button>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
