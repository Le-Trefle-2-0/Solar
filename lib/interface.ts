export interface Msg {
    author: {
        id: string;
        name: string;
        image: string;
    },
    content: string;
    timestamp: number;
    channel: {
        id: string;
    }
}