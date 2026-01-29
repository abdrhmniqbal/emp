import React, { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { $loadProgress } from '@/store/ui-store';
import { useToast, Toast } from 'heroui-native';
import { View } from 'react-native';

const ProgressToastContent = (props: any) => {
    const { progress, message } = useStore($loadProgress);

    return (
        <Toast variant="accent" {...props}>
            <Toast.Title>Indexing Library ({Math.round(progress)}%)</Toast.Title>
            <Toast.Description numberOfLines={1}>
                {message || "Scanning media library..."}
            </Toast.Description>
            <View className="h-1 w-full bg-white/20 rounded-full mt-2 overflow-hidden">
                <View
                    style={{ width: `${progress}%` }}
                    className="h-full bg-white rounded-full"
                />
            </View>
        </Toast>
    );
};

export const ProgressToast = () => {
    const { visible } = useStore($loadProgress);
    const { toast } = useToast();
    const isShowingRef = useRef(false);

    useEffect(() => {
        if (visible && !isShowingRef.current) {
            toast.show({
                id: 'indexing-progress',
                duration: 0,
                component: (props) => <ProgressToastContent {...props} />,
            });
            isShowingRef.current = true;
        } else if (!visible && isShowingRef.current) {
            toast.hide('indexing-progress');
            isShowingRef.current = false;
        }
    }, [visible]);

    return null;
};
