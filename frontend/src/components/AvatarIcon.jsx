import avatar1 from "../assets/avatars/avatar1.png";
import avatar2 from "../assets/avatars/avatar2.png";
import avatar3 from "../assets/avatars/avatar3.png";
import avatar4 from "../assets/avatars/avatar4.png";
import female1 from "../assets/avatars/female1.png";
import female2 from "../assets/avatars/female2.png";
import female3 from "../assets/avatars/female3.png";
import female4 from "../assets/avatars/female4.png";

export const MALE_AVATAR_OPTIONS = ["avatar1", "avatar2", "avatar3", "avatar4"];
export const FEMALE_AVATAR_OPTIONS = ["female1", "female2", "female3", "female4"];
export const AVATAR_OPTIONS = [...MALE_AVATAR_OPTIONS, ...FEMALE_AVATAR_OPTIONS];

const AVATAR_IMAGES = {
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  female1,
  female2,
  female3,
  female4,
};

export default function AvatarIcon({ id, className = "" }) {
  const src = AVATAR_IMAGES[id];
  if (!src) return null;

  return <img src={src} alt="" className={`avatar-icon ${className}`} />;
}