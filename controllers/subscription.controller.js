import Subscription from '../models/subscription.model.js'
import { workflowClient } from '../config/upstash.js'
import { SERVER_URL } from '../config/env.js'

export const createSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.create({
      ...req.body,
      user: req.user._id,
    });

    const { workflowRunId } = await workflowClient.trigger({
      url: `${SERVER_URL}/api/v1/workflows/subscription/reminder`,
      body: {
        subscriptionId: subscription.id,
      },
      headers: {
        'content-type': 'application/json',
      },
      retries: 0,
    })

    res.status(201).json({ success: true, data: { subscription, workflowRunId } });
  } catch (e) {
    next(e);
  }
}

export const getUserSubscriptions = async (req, res, next) => {
  try {
    // Check if the user is the same as the one in the token
    if(req.user.id !== req.params.id) {
      const error = new Error('You are not the owner of this account');
      error.status = 401;
      throw error;
    }

    const subscriptions = await Subscription.find({ user: req.params.id });

    res.status(200).json({ success: true, data: subscriptions });
  } catch (e) {
    next(e);
  }
}

export const updateSubscription = async (req, res, next) => {
  try {
    const subscriptionId = req.params.id;
    
    // Find the subscription first to check ownership
    const existingSubscription = await Subscription.findById(subscriptionId);
    
    if (!existingSubscription) {
      const error = new Error('Subscription not found');
      error.status = 404;
      throw error;
    }

    // Check if the user owns this subscription
    if (existingSubscription.user.toString() !== req.user._id.toString()) {
      const error = new Error('You are not authorized to update this subscription');
      error.status = 403;
      throw error;
    }

    // Update the subscription
    const updatedSubscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      { ...req.body },
      { 
        new: true, 
        runValidators: true 
      }
    );

    res.status(200).json({ 
      success: true, 
      message: 'Subscription updated successfully',
      data: updatedSubscription 
    });
  } catch (e) {
    next(e);
  }
}

export const deleteSubscription = async (req, res, next) => {
  try {
    const subscriptionId = req.params.id;
    
    // Find the subscription first to check ownership
    const existingSubscription = await Subscription.findById(subscriptionId);
    
    if (!existingSubscription) {
      const error = new Error('Subscription not found');
      error.status = 404;
      throw error;
    }

    // Check if the user owns this subscription
    if (existingSubscription.user.toString() !== req.user._id.toString()) {
      const error = new Error('You are not authorized to delete this subscription');
      error.status = 403;
      throw error;
    }

    // Delete the subscription
    await Subscription.findByIdAndDelete(subscriptionId);

    res.status(200).json({ 
      success: true, 
      message: 'Subscription deleted successfully'
    });
  } catch (e) {
    next(e);
  }
}

export const cancelSubscription = async (req, res, next) => {
  try {
    const subscriptionId = req.params.id;
    
    // Find the subscription first to check ownership
    const existingSubscription = await Subscription.findById(subscriptionId);
    
    if (!existingSubscription) {
      const error = new Error('Subscription not found');
      error.status = 404;
      throw error;
    }

    // Check if the user owns this subscription
    if (existingSubscription.user.toString() !== req.user._id.toString()) {
      const error = new Error('You are not authorized to cancel this subscription');
      error.status = 403;
      throw error;
    }

    // Check if subscription is already cancelled
    if (existingSubscription.status === 'cancelled') {
      const error = new Error('Subscription is already cancelled');
      error.status = 400;
      throw error;
    }

    // Cancel the subscription by updating its status
    const cancelledSubscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      { status: 'cancelled' },
      { 
        new: true, 
        runValidators: true 
      }
    );

    res.status(200).json({ 
      success: true, 
      message: 'Subscription cancelled successfully',
      data: cancelledSubscription 
    });
  } catch (e) {
    next(e);
  }
}