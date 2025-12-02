'use client';

import { useStandaloneVideoCall } from '../context/StandaloneVideoCallContext';
import FaceTimeSetup from './FaceTimeSetup';
import FaceTimeRoom from './FaceTimeRoom';

export default function FaceTimeVideoCall() {
    const { isInCall } = useStandaloneVideoCall();

    return (
        <>
            {isInCall ? <FaceTimeRoom /> : <FaceTimeSetup />}
        </>
    );
}
