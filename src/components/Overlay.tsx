import { h } from 'preact';

interface OverlayProps {
    price: string;
    onPurchase: () => void;
}

export function Overlay({ price, onPurchase }: OverlayProps) {
    return (
        <div className="absolute top-0 left-0 w-full h-full bg-black/60 flex flex-col items-center justify-center z-50 font-sans p-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-sm w-full">
                <p className="text-gray-900 text-lg mb-4 font-medium leading-relaxed">
                    This content requires a purchase to continue reading.
                </p>
                <p className="text-green-600 text-2xl font-bold mb-6">
                    Price: ${price}
                </p>
                <button
                    onClick={onPurchase}
                    className="w-full bg-[#0077b5] hover:bg-[#006097] text-white font-bold py-3 px-6 rounded transition-colors duration-200"
                >
                    Purchase Content
                </button>
            </div>
        </div>
    );
}
