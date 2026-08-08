import { forwardRef, useImperativeHandle } from 'react'
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion'

const SWIPE_THRESHOLD = 120   // px drag distance that counts as a decision
const VELOCITY_THRESHOLD = 500 // px/s flick speed that also counts, even if offset is short
const EXIT_DISTANCE = 600      // how far off-screen the card flies before unmounting

const SwipeCard = forwardRef(function SwipeCard({ product, onSwipe, isTop }, ref) {
    // x is the single source of truth for horizontal position.
    // rotate/likeOpacity/nopeOpacity are all *derived* from it via useTransform,
    // so dragging AND programmatic animation (via controls) update them automatically.
    const x = useMotionValue(0)
    const rotate = useTransform(x, [-300, 300], [-20, 20])
    const likeOpacity = useTransform(x, [10, SWIPE_THRESHOLD], [0, 1])
    const nopeOpacity = useTransform(x, [-SWIPE_THRESHOLD, -10], [1, 0])

    const controls = useAnimation()

    // Exposes swipe(direction) so the Like/Dislike buttons in App.jsx can
    // trigger the exact same physics as a real drag.
    useImperativeHandle(ref, () => ({
        swipe: async (direction) => {
            await controls.start({
                x: direction === 'like' ? EXIT_DISTANCE : -EXIT_DISTANCE,
                opacity: 0,
                transition: { duration: 0.35, ease: 'easeOut' },
            })
            onSwipe(direction, product.id)
        },
    }))

    function handleDragEnd(_, info) {
        const { offset, velocity } = info

        if (offset.x > SWIPE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD) {
            controls
                .start({ x: EXIT_DISTANCE, opacity: 0, transition: { duration: 0.3, ease: 'easeOut' } })
                .then(() => onSwipe('like', product.id))
        } else if (offset.x < -SWIPE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD) {
            controls
                .start({ x: -EXIT_DISTANCE, opacity: 0, transition: { duration: 0.3, ease: 'easeOut' } })
                .then(() => onSwipe('dislike', product.id))
        } else {
            // Didn't cross the threshold — spring back to center.
            controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } })
        }
    }

    return (
        <motion.div
            className="absolute inset-0"
            style={{ x, rotate }}
            drag={isTop ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            whileDrag={{ scale: 1.03 }}
            onDragEnd={handleDragEnd}
            animate={controls}
        >
            <div className="relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col select-none">
                <motion.div
                    className="absolute top-6 left-6 z-20 border-4 border-emerald-500 text-emerald-500 font-extrabold text-3xl px-4 py-1 rounded-xl -rotate-12"
                    style={{ opacity: likeOpacity }}
                >
                    LIKE
                </motion.div>
                <motion.div
                    className="absolute top-6 right-6 z-20 border-4 border-rose-500 text-rose-500 font-extrabold text-3xl px-4 py-1 rounded-xl rotate-12"
                    style={{ opacity: nopeOpacity }}
                >
                    NOPE
                </motion.div>

                <div className="relative w-full h-3/5">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover pointer-events-none"
                        draggable="false"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                <div className="flex-1 p-5 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
                            <p className="text-sm text-gray-500">{product.brand}</p>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full whitespace-nowrap">
                            {product.category}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">₹{product.price}</span>
                        <span className="text-sm text-gray-400 line-through">₹{product.originalPrice}</span>
                        <span className="text-sm text-emerald-600 font-semibold">{product.discount}% off</span>
                    </div>

                    <div className="mt-1 bg-violet-50 text-violet-700 text-sm p-3 rounded-xl leading-snug">
                        ✨ {product.matchReason}
                    </div>
                </div>
            </div>
        </motion.div>
    )
})

export default SwipeCard