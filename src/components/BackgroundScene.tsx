import React, { useState } from 'react';

interface BackgroundSceneProps {
  opacityClass?: string;
}

const BACKGROUND_IMAGE_URL = '/src/assets/images/minecraft_brain_puzzle_bg_1795258932253.jpg';

export const BackgroundScene: React.FC<BackgroundSceneProps> = ({
  opacityClass = 'opacity-[0.16]',
}) => {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden"
      aria-hidden="true"
    >
      {!failed ? (
        <img
          src={BACKGROUND_IMAGE_URL}
          alt="Ilustração em estilo voxel de cabeça semiaberta com cérebro de quebra-cabeça e símbolos de divisão"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={`w-full h-full object-cover object-center ${opacityClass}`}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-200/40" />
      )}
    </div>
  );
};
