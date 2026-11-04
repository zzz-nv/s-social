'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';

import InlineComposer from '@/components/InlineComposer';
import TweetCard from '@/components/TweetCard';
import { loadFeed } from '@/lib/loadFeed';
import { deleteTweetWithImages } from '@/lib/deleteTweet';



const TAB_KEY = 'feed-tab';

function subscribeTab(cb: () => void) {
  window.addEventListener('feed-tab-change', cb);
  return () => window.removeEventListener('feed-tab-change', cb);
}

function getTabSnapshot(): 'global' | 'following' {
  return (sessionStorage.getItem(TAB_KEY) as 'global' | 'following') || 'global';
}

function getServerTabSnapshot(): 'global' | 'following' {
  return 'global';
}


export default function ProjectS() {
  const router = useRouter();
  const queryClient = useQueryClient();

      const feedType = useSyncExternalStore(
    subscribeTab,
    getTabSnapshot,
    getServerTabSnapshot
  );

  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => { setIsHydrated(true); }, []);

  const [justPostedId, setJustPostedId] = useState<string | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent).detail.id;
      setJustPostedId(id);
      setTimeout(() => setJustPostedId(null), 1200);
    };
    window.addEventListener('post-created', handler);
    return () => window.removeEventListener('post-created', handler);
  }, []);

  function switchTab(tab: 'global' | 'following') {
    if (tab === feedType) return;
    sessionStorage.setItem(TAB_KEY, tab);
    window.dispatchEvent(new Event('feed-tab-change'));
    window.dispatchEvent(new Event('reset-feed-scroll'));
  }

  const { data, isLoading } = useQuery({
    queryKey: ['feed', feedType],
    queryFn: () => loadFeed(feedType),
  });

  const user = data?.user;
  const tweets = data?.tweets ?? [];

  // Hide the transition splash as soon as feed data is ready
  useEffect(() => {
    if (data !== null) {
      window.dispatchEvent(new CustomEvent('hide-splash'));
    }
  }, [data]);

  
  
  // Refresh feed when a new tweet is posted
  useEffect(() => {
    const handleRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    };
    window.addEventListener('refresh-feed', handleRefresh);
    return () => window.removeEventListener('refresh-feed', handleRefresh);
  }, [queryClient]);

  

    async function deleteTweet(tweetId: string) {
    // Optimistic cache update
    queryClient.setQueryData(['feed', feedType], (prev: any) => {
      if (!prev) return prev;
      return { ...prev, tweets: prev.tweets.filter((t: any) => t.id !== tweetId) };
    });

    const result = await deleteTweetWithImages(tweetId);

    if (!result.ok) {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    } else {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Deleted!' } }));
    }
  }

  return (
    <div className="min-h-screen bg-background text-white flex flex-col font-sans">

      {/* MINIMAL FEED TOGGLE */}
      <div className="sticky top-0 z-40 bg-background backdrop-blur-md border-b border-border-subtle flex w-full">
                  <button
          onClick={() => switchTab('global')}
          className="flex-1 flex justify-center hover:bg-surface transition-colors pt-4 pb-4"
        >
          <div className={`font-bold text-base relative px-2 transition-colors duration-150 ${feedType === 'global' ? 'text-brand' : 'text-text-muted'}`}>
            Global
            {feedType === 'global' && (
              <motion.div
                key={isHydrated ? 'hydrated' : 'initial'}
                layoutId={isHydrated ? 'tab-underline' : undefined}
                className="absolute -bottom-4 left-0 w-full h-1 bg-brand rounded-t-full"
                transition={{ type: 'tween', duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              />
            )}
          </div>
        </button>

        <button
          onClick={() => switchTab('following')}
          className="flex-1 flex justify-center hover:bg-surface transition-colors pt-4 pb-4"
        >
          <div className={`font-bold text-base relative px-2 transition-colors duration-150 ${feedType === 'following' ? 'text-brand' : 'text-text-muted'}`}>
            Following
          {feedType === 'following' && (
              <motion.div
                key={isHydrated ? 'hydrated' : 'initial'}
                layoutId={isHydrated ? 'tab-underline' : undefined}
                className="absolute -bottom-4 left-0 w-full h-1 bg-brand rounded-t-full"
                transition={{ type: 'tween', duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              />
            )}
          </div>
        </button>
      </div>

      <main className="w-full max-w-2xl mx-auto border-x border-border-subtle min-h-screen pb-24">
        <InlineComposer />

        {isLoading ? (
          <div className="w-full flex flex-col">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-5 border-b border-border-subtle flex gap-3 animate-pulse">
                <div className="w-10 h-10 bg-surface-muted rounded-full shrink-0"></div>
                <div className="flex-1 space-y-3 mt-1">
                  <div className="h-4 bg-surface-muted rounded w-1/4"></div>
                  <div className="h-4 bg-surface-muted rounded w-3/4"></div>
                  <div className="h-4 bg-surface-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : tweets.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center p-12 text-center mt-12"
          >
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6 border border-border-subtle">
              <Users className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {feedType === 'following' ? "You're not following anyone yet" : "No posts yet"}
            </h3>
            <p className="text-text-muted text-sm max-w-xs mb-6">
              {feedType === 'following' 
                ? "When you follow people, their posts will show up here." 
                : "Be the first to post something!"}
            </p>
            
            {feedType === 'following' && (
              <button 
                onClick={() => switchTab('global')}
                className="bg-zinc-100 hover:bg-white text-black font-bold py-2.5 px-6 rounded-full transition active:scale-95"
              >
                Find people to follow
              </button>
            )}
          </motion.div>
        ) : (
            <AnimatePresence initial={false}>
            {tweets.filter((t: any) => !t.parent_id).map((tweet: any) => (
              <TweetCard
                key={tweet.id}
                tweet={tweet}
                currentUserId={user?.id}
                onDelete={deleteTweet}
                variant="feed"
                justPosted={tweet.id === justPostedId}
              />
            ))}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}