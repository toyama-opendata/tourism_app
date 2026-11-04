import sys
from pathlib import Path
import numpy as np
import pandas as pd
import pytest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from scoring import nps, shrink, business_only, eligible_visits, log_lift_difference, zscore, reason_text
from scoring import mainstream_hidden

@pytest.mark.parametrize('delta',[1,20,100,200])
def test_high_visitation_cannot_be_hidden_by_high_nps(delta):
    _,final,eligible,_=mainstream_hidden(.15,delta,1000,-2)
    assert final>0 and not eligible

@pytest.mark.parametrize('rate,delta,n',[(.05,10,100),(.01,0,100),(.01,-10,100),(.01,10,29),(.01,None,100)])
def test_prior_cannot_bypass_hidden_gate(rate,delta,n):
    _,final,eligible,_=mainstream_hidden(rate,delta,n,-2)
    assert final>=0 and not eligible

def test_hidden_requires_both_conditions_and_sample_size():
    _,final,eligible,_=mainstream_hidden(.01,20,30,0)
    assert eligible and final<0

def test_no_visitors_cannot_be_hidden():
    _,final,eligible,_=mainstream_hidden(0,None,0,-2)
    assert final==0 and not eligible

def test_hidden_monotonicity():
    def score(rate,delta): return mainstream_hidden(rate,delta,100,0)[1]
    assert score(.01,20)<=score(.03,20)
    assert score(.01,20)<=score(.01,5)

def test_seasonal_mainstream_prior_guard():
    _,final,eligible,why=mainstream_hidden(.01,40,400,1.2)
    assert final>=1.2 and not eligible and why=='mainstream_prior_guard'

def test_nps_boundaries_and_missing():
    assert nps([0,6,7,8,9,10,None,11,-1,9.5])==pytest.approx(0)
    assert nps([9,10])==100
    assert nps([None,99]) is None

def test_new_option_never_uses_pre_revision_answers():
    dates=pd.Series(pd.to_datetime(['2026-03-31','2026-04-01','2026-04-02']))
    eligible,visited=eligible_visits(dates,pd.Series([1,1,0]),'2026-04-01')
    assert eligible.sum()==2 and visited.sum()==1

def test_business_only_does_not_exclude_mixed_trip():
    d=pd.DataFrame({'work':[1,1,0,0],'food':[0,1,1,0]})
    assert business_only(d,['work','food'],'work').tolist()==[True,False,False,False]

def test_shrink_and_no_data():
    assert shrink(2,-2,30,30)==0
    assert shrink(np.nan,1,0)==1
    assert shrink(1,-1,90,30)==.5

def test_log_lift_same_profile_is_neutral_and_zero_is_finite():
    assert log_lift_difference(10,10,20,50,50,100)==0
    assert np.isfinite(log_lift_difference(0,10,20,0,50,100))
    assert np.isnan(log_lift_difference(0,0,0,1,1,100))

def test_zscore_and_reason_suppression():
    assert zscore([1,1,1]).tolist()==[0,0,0]
    assert reason_text('温泉',4,9) is None
    assert '40%' in reason_text('温泉',4,10)

def test_missing_is_not_zero_in_zscores():
    z=zscore([1,np.nan,3])
    assert z.iloc[0]==-1 and z.iloc[2]==1 and np.isnan(z.iloc[1])
