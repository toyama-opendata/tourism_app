"""Phase 1 scoring primitives. Positive direction: N, A, G, M."""
import numpy as np
import pandas as pd

def valid_nps(values):
    s=pd.to_numeric(pd.Series(values), errors='coerce')
    return s[s.between(0,10) & s.eq(s.round())]

def nps(values):
    s=valid_nps(values)
    return None if s.empty else float(100*((s>=9).mean()-(s<=6).mean()))

def zscore(values):
    s=pd.Series(values,dtype=float)
    std=s.std(ddof=0)
    return s*0 if not std or pd.isna(std) else (s-s.mean())/std

def shrink(data_score, prior, n, k=30):
    if k<=0 or n<0: raise ValueError('k must be positive and n nonnegative')
    if n==0 or data_score is None or pd.isna(data_score): return float(prior)
    return float((n*data_score+k*prior)/(n+k))

def business_only(frame, purpose_columns, business_column):
    return frame[business_column].eq(1) & frame[purpose_columns].eq(1).sum(axis=1).eq(1)

def eligible_visits(dates, flags, available_from, available_to=None):
    eligible=dates.ge(pd.Timestamp(available_from))
    if available_to: eligible &= dates.le(pd.Timestamp(available_to))
    return eligible, eligible & flags.eq(1)

def log_lift_difference(left_count,right_count,n,base_left,base_right,total,alpha=.5):
    if n==0 or total==0: return np.nan
    left=((left_count+alpha)/(n+2*alpha))/((base_left+alpha)/(total+2*alpha))
    right=((right_count+alpha)/(n+2*alpha))/((base_right+alpha)/(total+2*alpha))
    return float(np.log(left)-np.log(right))

def reason_text(name,count,n,minimum=10):
    if n<minimum: return None
    return f'この場所を訪れた回答の{count/n:.0%}が「{name}」目的（{count}/{n}件）。目的は旅行全体についての回答です。'

def mainstream_hidden(rate, nps_difference, n, prior, k=30,
                      max_hidden_visit_rate=.05, min_hidden_n=30,
                      nps_advantage_scale=20, mainstream_prior_threshold=1.0):
    """Conjunctive H gate. NPS cannot offset a high visitation rate.

    Thresholds are editorial proposals, not learned probabilities. Clamp after
    shrinkage too, so a negative prior cannot bypass the eligibility criteria.
    Returns data score, final score, eligible flag, and explanation code.
    """
    if not 0<max_hidden_visit_rate<1 or min_hidden_n<1 or nps_advantage_scale<=0:
        raise ValueError('Invalid axis4 settings')
    if rate is None or pd.isna(rate) or n==0:
        return np.nan, max(0.,float(prior)), False, 'insufficient_data'
    if not 0<=rate<=1: raise ValueError('Invalid visit rate')
    eligible=(rate<max_hidden_visit_rate and n>=min_hidden_n
              and nps_difference is not None and not pd.isna(nps_difference)
              and nps_difference>0)
    popularity=float(np.clip(rate/max_hidden_visit_rate-1,0,2))
    # Conservative editorial guard for known mainstream destinations, including
    # seasonal landmarks whose full-period visit rate can be misleadingly low.
    if prior>=mainstream_prior_threshold:
        score=max(popularity,float(prior))
        return score,shrink(score,prior,n,k),False,'mainstream_prior_guard'
    if eligible:
        rarity=1-rate/max_hidden_visit_rate
        advantage=min(nps_difference/nps_advantage_scale,1)
        score=-2*min(rarity,advantage)
        why='low_visit_and_positive_nps'
    else:
        score=popularity
        why=('visit_rate_not_low' if rate>=max_hidden_visit_rate else
             'insufficient_n' if n<min_hidden_n else
             'nps_missing' if nps_difference is None or pd.isna(nps_difference) else
             'nps_not_above_baseline')
    final=shrink(score,prior,n,k)
    return score, final if eligible else max(0.,final), bool(eligible), why
