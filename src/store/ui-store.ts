import { atom } from 'nanostores';

export const $barsVisible = atom(true);
export const $isPlayerExpanded = atom(false);

let scrollTimeout: NodeJS.Timeout;

export const handleScrollStart = () => {
    $barsVisible.set(false);
    if (scrollTimeout) clearTimeout(scrollTimeout);
};

export const handleScrollStop = () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        $barsVisible.set(true);
    }, 150);
};

export const $loadProgress = atom<{
    visible: boolean;
    progress: number;
    message: string;
}>({
    visible: false,
    progress: 0,
    message: '',
});

export const showProgress = (message: string) => {
    $loadProgress.set({ visible: true, progress: 0, message });
};

export const updateProgress = (progress: number, message?: string) => {
    const current = $loadProgress.get();
    $loadProgress.set({
        ...current,
        progress: Math.min(100, Math.max(0, progress)),
        message: message ?? current.message
    });
};

export const hideProgress = () => {
    $loadProgress.set({ visible: false, progress: 0, message: '' });
};
