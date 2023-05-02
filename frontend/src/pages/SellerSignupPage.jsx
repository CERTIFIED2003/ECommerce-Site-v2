import React, { useEffect } from 'react';
import SellerSignup from '../components/Seller/SellerSignup';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const SellerSignupPage = () => {
  const { isSellerAuthenticated, seller } = useSelector((state) => state.seller);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSellerAuthenticated) {
      navigate(`/seller/${seller._id}`);
    }
  }, [isSellerAuthenticated, navigate, seller?._id]);

  return (
    <div>
      <SellerSignup />
    </div>
  )
}

export default SellerSignupPage