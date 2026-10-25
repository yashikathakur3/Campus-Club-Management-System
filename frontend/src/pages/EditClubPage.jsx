import { useParams } from 'react-router-dom';
import ClubForm from '../components/clubs/ClubForm';
export default function EditClubPage() { const { id } = useParams(); return <ClubForm clubId={id} />; }
