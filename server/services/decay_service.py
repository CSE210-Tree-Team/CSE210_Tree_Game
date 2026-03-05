"""Passive decay background service."""
import asyncio
from typing import Optional
from services.tree_service import TreeService


class DecayService:
    """
    Manages the passive decay background task.
    
    This service handles the lifecycle of the background task that periodically
    applies passive decay to all trees in the game. It ensures trees gradually
    lose resources over time if students don't maintain them.
    
    Attributes:
        decay_rate_minutes: How often to run decay (in minutes)
        task: The asyncio.Task running the decay loop (or None if not started)
    """
    
    def __init__(self, decay_rate_minutes: int):
        self.decay_rate_minutes = decay_rate_minutes
        self.task: Optional[asyncio.Task] = None
    
    async def run_decay_loop(self):
        """
        Background task that applies passive decay to all trees periodically.
        
        This method runs in an infinite loop, applying decay to all trees
        at regular intervals. It handles errors gracefully to ensure one
        tree's failure doesn't stop the entire decay process.
        
        The loop:
        1. Calls TreeService.apply_decay_to_all()
        2. Sleeps for decay_rate_minutes
        3. Repeats
        
        Note: This method should not be called directly. Use start() instead.
        """
        while True:
            try:
                count = TreeService.apply_decay_to_all()
                print(f"Applied passive decay to {count} trees")
                
                # Sleep for the specified rate (converted to seconds)
                await asyncio.sleep(self.decay_rate_minutes * 60)
                
            except Exception as e:
                print(f"Error in passive decay loop: {e}")
                # Sleep for 1 minute before retrying
                await asyncio.sleep(60)
    
    def start(self):
        if self.task is None or self.task.done():
            self.task = asyncio.create_task(self.run_decay_loop())
            print(f"Passive decay background task started (interval: {self.decay_rate_minutes} minutes)")
    
    def stop(self):
        if self.task and not self.task.done():
            self.task.cancel()
            print("Passive decay background task stopped")
